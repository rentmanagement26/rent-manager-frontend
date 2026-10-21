"use server";

// Server actions for plan proposals. Each re-checks the admin's permission; the backend enforces it as well.
import { SessionExpiredError } from "@/lib/api-error";
import { requireAdmin } from "@/lib/auth-guard";
import { getPermissions, PERMISSIONS } from "@/lib/permissions";
import { ProposalError, getAwaitingProposals, sendProposal, withdrawProposal } from "@/lib/proposal-api";
import type { ActionFailure, AwaitingProposal, SendProposalResult } from "@/lib/types";

// Turns a thrown error into the { error, expired } shape the client narrows on.
function failure(err: unknown, fallback: string): ActionFailure {
  if (err instanceof SessionExpiredError) return { error: err.message, expired: true };
  if (err instanceof ProposalError) return { error: err.message, expired: false };
  return { error: fallback, expired: false };
}

// Offers a landlord a plan. The plan changes only after the landlord approves it.
export async function sendProposalAction(input: {
  landlordProfileId: number;
  packageId: number;
  message: string;
  staffNote: string;
}): Promise<{ ok: true; result: SendProposalResult } | ActionFailure> {
  const session = await requireAdmin();

  const { can } = await getPermissions(session);
  if (!can(PERMISSIONS.subscriptionsChange)) return { error: "Your role can't send plan proposals.", expired: false };

  const message = String(input.message ?? "").trim().slice(0, 500);
  const staffNote = String(input.staffNote ?? "").trim().slice(0, 500);

  try {
    const result = await sendProposal(session.backendToken, {
      landlordProfileId: Number(input.landlordProfileId),
      toPackageId: Number(input.packageId),
      message,
      staffNote,
    });
    return { ok: true, result };
  } catch (err) {
    return failure(err, "Couldn't send the proposal. Try again.");
  }
}

// Takes back a proposal the landlord has not answered.
export async function withdrawProposalAction(changeId: number): Promise<{ ok: true } | ActionFailure> {
  const session = await requireAdmin();

  const { can } = await getPermissions(session);
  if (!can(PERMISSIONS.subscriptionsChange)) return { error: "Your role can't withdraw proposals.", expired: false };

  try {
    await withdrawProposal(session.backendToken, Number(changeId));
    return { ok: true };
  } catch (err) {
    return failure(err, "Couldn't withdraw the proposal. Try again.");
  }
}

// Polled by the open page: which proposals are still waiting for an answer. `search` limits it to one landlord.
export async function loadAwaitingProposalsAction(search?: string): Promise<{ ok: true; data: AwaitingProposal[] } | ActionFailure> {
  const session = await requireAdmin();

  const result = await getAwaitingProposals(session.backendToken, search?.slice(0, 100) || undefined);
  if (result.status === "ok") return { ok: true, data: result.data };
  if (result.status === "expired") return { error: "Your session expired. Sign in again.", expired: true };
  return { error: "Couldn't check for answers.", expired: false };
}
