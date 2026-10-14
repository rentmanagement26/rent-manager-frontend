import { backendFetch, getJson } from "@/lib/api-client";
import { SessionExpiredError, extractErrorMessage } from "@/lib/api-error";
import type {
  AdminLandlordSubscription,
  AdminPackage,
  LandlordPage,
  LimitViolation,
  PlanChangeReasonCode,
} from "@/lib/types";

const BASE = "/api/v1/admin";

// The plan catalog: every plan with its current price, limits and features.
export function getPackages(token: string) {
  return getJson<AdminPackage[]>(`${BASE}/packages`, token);
}

// Landlords, newest first, each with their plan name and status. `beforeId` pages to older ones.
export function getLandlords(token: string, query: { search?: string; beforeId?: number; limit?: number } = {}) {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.beforeId) params.set("beforeId", String(query.beforeId));
  params.set("limit", String(query.limit ?? 25));
  return getJson<LandlordPage>(`${BASE}/landlords?${params}`, token);
}

// One landlord's plan, with usage against each limit.
export function getLandlordSubscription(token: string, landlordProfileId: number) {
  return getJson<AdminLandlordSubscription>(`${BASE}/landlords/${landlordProfileId}/subscription`, token);
}

// Thrown when the backend refuses a plan change. `code` is the backend's stable error code
// ("over_limits", "already_on_plan", "reason_required", ...) and `violations` lists the broken limits.
export class PlanChangeError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly violations?: LimitViolation[],
  ) {
    super(message);
  }
}

export interface ChangePlanInput {
  packageId: number;
  reasonCode: PlanChangeReasonCode;
  note: string;
  overrideUsageCheck: boolean;
}

interface PlanChangeErrorBody {
  code?: string;
  message?: string;
  violations?: { limitKey: string; displayName: string; limit: number; used: number }[];
}

// Moves a landlord to another plan. Returns nothing on success; throws SessionExpiredError or PlanChangeError.
export async function changeLandlordPlan(token: string, landlordProfileId: number, input: ChangePlanInput): Promise<void> {
  const response = await backendFetch(`${BASE}/landlords/${landlordProfileId}/subscription`, token, {
    method: "PUT",
    body: JSON.stringify({
      PackageId: input.packageId,
      ReasonCode: input.reasonCode,
      Note: input.note,
      OverrideUsageCheck: input.overrideUsageCheck,
    }),
  });

  if (response.ok) return;
  if (response.status === 401) throw new SessionExpiredError();
  if (response.status === 429) throw new PlanChangeError("Too many attempts. Wait a minute and try again.");

  // The backend's plan-change errors look like { code, message, violations? }.
  const text = await response.text();
  let body: PlanChangeErrorBody | null = null;
  try {
    body = JSON.parse(text) as PlanChangeErrorBody;
  } catch {
    // Not JSON (for example an empty 403); handled below.
  }

  if (body?.message) {
    throw new PlanChangeError(body.message, body.code, body.violations);
  }
  if (response.status === 403) {
    throw new PlanChangeError("Your role can't change plans.");
  }
  throw new PlanChangeError(await extractErrorMessage(new Response(text)));
}
