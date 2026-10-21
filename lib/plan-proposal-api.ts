// Backend calls for plan proposals from support. A plan changes only when the landlord approves here.
import { backendFetch } from "@/lib/api-client";
import { SessionExpiredError } from "@/lib/api-error";
import type { PendingPlanChange } from "@/lib/types";

// Thrown when the backend refuses an answer; the message is safe to show the landlord.
export class ProposalAnswerError extends Error {}

// The changes this landlord has been told about and not settled, newest first.
export async function getMyPendingChanges(token: string): Promise<PendingPlanChange[]> {
  const response = await backendFetch("/api/v1/subscription/changes", token, { cache: "no-store" });
  if (response.status === 401) throw new SessionExpiredError();
  if (!response.ok) throw new Error("Couldn't load your plan changes.");
  return response.json();
}

// Approves (accept) or declines a proposal. Approving changes the plan right away, with the usual limit checks.
export async function answerProposal(token: string, changeId: number, accept: boolean): Promise<void> {
  const response = await backendFetch(`/api/v1/subscription/proposals/${changeId}/${accept ? "accept" : "decline"}`, token, {
    method: "POST",
  });
  if (response.ok) return;
  if (response.status === 401) throw new SessionExpiredError();
  if (response.status === 429) throw new ProposalAnswerError("Too many attempts. Wait a minute and try again.");

  // The backend's plan errors look like { code, message }.
  try {
    const body = (await response.json()) as { message?: string };
    if (body.message) throw new ProposalAnswerError(body.message);
  } catch (err) {
    if (err instanceof ProposalAnswerError) throw err;
  }
  throw new ProposalAnswerError("Couldn't save your answer. Please try again.");
}
