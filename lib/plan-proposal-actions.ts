"use server";

// Server action for answering a plan proposal. The backend checks that the proposal belongs to the signed-in landlord.
import { SessionExpiredError } from "@/lib/api-error";
import { requireBackendToken } from "@/lib/auth-guard";
import { ProposalAnswerError, answerProposal } from "@/lib/plan-proposal-api";
import type { ActionFailure } from "@/lib/types";

export async function answerProposalAction(changeId: number, accept: boolean): Promise<{ ok: true } | ActionFailure> {
  const session = await requireBackendToken(["Landlord"]);

  try {
    await answerProposal(session.backendToken, Number(changeId), accept === true);
    return { ok: true };
  } catch (err) {
    if (err instanceof SessionExpiredError) return { error: err.message, expired: true };
    if (err instanceof ProposalAnswerError) return { error: err.message, expired: false };
    return { error: "Couldn't save your answer. Please try again.", expired: false };
  }
}
