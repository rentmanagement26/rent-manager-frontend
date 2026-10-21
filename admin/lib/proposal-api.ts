// Backend calls for plan proposals: staff offers a plan, the landlord approves it themselves (by email link),
// and nothing changes until they do. Staff can never approve on a customer's behalf.
import { backendFetch, getJson } from "@/lib/api-client";
import { SessionExpiredError, extractErrorMessage } from "@/lib/api-error";
import type { ApiResult, AwaitingProposal, SendProposalResult } from "@/lib/types";

const BASE = "/api/v1/admin/subscriptions";

// Shape of one row of GET /admin/subscriptions (only what we read).
interface SubscriptionListBody {
  items: { landlordProfileId: number; name: string; businessName: string | null; proposal: { id: number } | null }[];
}

// Landlords with a proposal waiting for their answer. `search` narrows it (name, email or business).
export async function getAwaitingProposals(token: string, search?: string): Promise<ApiResult<AwaitingProposal[]>> {
  const params = new URLSearchParams({ status: "proposed", pageSize: "100" });
  if (search) params.set("search", search);

  const result = await getJson<SubscriptionListBody>(`${BASE}?${params}`, token);
  if (result.status !== "ok") return result;

  const awaiting = result.data.items
    .filter((item) => item.proposal)
    .map((item) => ({
      landlordProfileId: item.landlordProfileId,
      landlordName: item.businessName || item.name,
      changeId: item.proposal!.id,
    }));
  return { status: "ok", data: awaiting };
}

// Thrown when the backend refuses a proposal or a withdrawal; the message is safe to show.
export class ProposalError extends Error {}

interface ErrorBody {
  message?: string;
}

// Turns a failed response into a thrown error (401 becomes SessionExpiredError).
async function failWith(response: Response, forbiddenText: string): Promise<never> {
  if (response.status === 401) throw new SessionExpiredError();
  if (response.status === 429) throw new ProposalError("Too many attempts. Wait a minute and try again.");
  if (response.status === 403) throw new ProposalError(forbiddenText);

  const text = await response.text();
  try {
    const body = JSON.parse(text) as ErrorBody;
    if (body.message) throw new ProposalError(body.message);
  } catch (err) {
    if (err instanceof ProposalError) throw err;
  }
  throw new ProposalError(await extractErrorMessage(new Response(text)));
}

interface SendBody {
  items: { outcome: SendProposalResult["outcome"]; message: string | null; changeId: number | null; violations: SendProposalResult["violations"] }[];
}

// Offers one landlord a plan. The landlord is emailed and told in the app; the plan changes only when they approve.
export async function sendProposal(
  token: string,
  input: { landlordProfileId: number; toPackageId: number; message: string; staffNote: string },
): Promise<SendProposalResult> {
  const response = await backendFetch(`${BASE}/proposals`, token, {
    method: "POST",
    body: JSON.stringify({
      LandlordProfileIds: [input.landlordProfileId],
      ToPackageId: input.toPackageId,
      Message: input.message || null,
      StaffNote: input.staffNote || null,
    }),
  });
  if (!response.ok) return failWith(response, "Your role can't send plan proposals.");

  const body = (await response.json()) as SendBody;
  const item = body.items[0];
  return { outcome: item.outcome, message: item.message, changeId: item.changeId, violations: item.violations ?? [] };
}

// Takes back a proposal the landlord has not answered.
export async function withdrawProposal(token: string, changeId: number): Promise<void> {
  const response = await backendFetch(`${BASE}/proposals/${changeId}/withdraw`, token, { method: "POST" });
  if (response.ok) return;
  await failWith(response, "Your role can't withdraw proposals.");
}
