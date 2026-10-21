"use server";

// Server actions for plan proposals. Each re-checks the admin's permission; the backend enforces it as well.
import { SessionExpiredError } from "@/lib/api-error";
import { requireAdmin } from "@/lib/auth-guard";
import { getPermissions, PERMISSIONS } from "@/lib/permissions";
import {
  ProposalError,
  cancelPlannedChange,
  getAwaitingProposals,
  postponePlannedChange,
  previewProposals,
  sendProposal,
  sendProposals,
  withdrawProposal,
} from "@/lib/proposal-api";
import type { ActionFailure, AwaitingProposal, BulkProposalPreview, BulkSendResult, SendProposalResult } from "@/lib/types";

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
  // How many days the landlord has to answer (1 to 90); null for no end.
  expiresInDays: number | null;
}): Promise<{ ok: true; result: SendProposalResult } | ActionFailure> {
  const session = await requireAdmin();

  const { can } = await getPermissions(session);
  if (!can(PERMISSIONS.subscriptionsChange)) return { error: "Your role can't send plan proposals.", expired: false };

  const message = String(input.message ?? "").trim().slice(0, 500);
  const staffNote = String(input.staffNote ?? "").trim().slice(0, 500);
  const days = input.expiresInDays === null ? null : Number(input.expiresInDays);
  if (days !== null && (!Number.isInteger(days) || days < 1 || days > 90)) {
    return { error: "A proposal can stay open for 1 to 90 days.", expired: false };
  }

  try {
    const result = await sendProposal(session.backendToken, {
      landlordProfileId: Number(input.landlordProfileId),
      toPackageId: Number(input.packageId),
      message,
      staffNote,
      expiresInDays: days,
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

// Cancels a planned plan change (a note is required, 500 characters at most).
export async function cancelPlannedChangeAction(changeId: number, note: string): Promise<{ ok: true } | ActionFailure> {
  const session = await requireAdmin();

  const { can } = await getPermissions(session);
  if (!can(PERMISSIONS.subscriptionsChange)) return { error: "Your role can't cancel planned changes.", expired: false };

  const cleaned = String(note ?? "").trim();
  if (!cleaned || cleaned.length > 500) return { error: "Add a note explaining the change (up to 500 characters).", expired: false };

  try {
    await cancelPlannedChange(session.backendToken, Number(changeId), cleaned);
    return { ok: true };
  } catch (err) {
    return failure(err, "Couldn't cancel the change. Try again.");
  }
}

// Moves a planned change later. `until` is a yyyy-mm-dd date from the date picker.
export async function postponePlannedChangeAction(changeId: number, until: string, note: string): Promise<{ ok: true } | ActionFailure> {
  const session = await requireAdmin();

  const { can } = await getPermissions(session);
  if (!can(PERMISSIONS.subscriptionsChange)) return { error: "Your role can't postpone planned changes.", expired: false };

  const cleaned = String(note ?? "").trim();
  if (!cleaned || cleaned.length > 500) return { error: "Add a note explaining the change (up to 500 characters).", expired: false };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(until))) return { error: "Choose a date.", expired: false };

  try {
    await postponePlannedChange(session.backendToken, Number(changeId), until, cleaned);
    return { ok: true };
  } catch (err) {
    return failure(err, "Couldn't postpone the change. Try again.");
  }
}

// The backend takes up to 500 landlords at once; the list page offers at most 25.
function cleanIds(ids: number[]): number[] | null {
  const list = Array.from(new Set((ids ?? []).map((id) => Number(id))));
  return list.length > 0 && list.length <= 500 && list.every((id) => Number.isInteger(id) && id > 0) ? list : null;
}

// Shows who could be offered a plan among the selected landlords, without sending anything.
export async function previewBulkProposalsAction(
  landlordProfileIds: number[],
  packageId: number,
): Promise<{ ok: true; preview: BulkProposalPreview } | ActionFailure> {
  const session = await requireAdmin();

  const { can } = await getPermissions(session);
  if (!can(PERMISSIONS.subscriptionsChange)) return { error: "Your role can't send plan proposals.", expired: false };
  const ids = cleanIds(landlordProfileIds);
  if (!ids) return { error: "Select between 1 and 500 landlords.", expired: false };

  try {
    return { ok: true, preview: await previewProposals(session.backendToken, ids, Number(packageId)) };
  } catch (err) {
    return failure(err, "Couldn't check the selection. Try again.");
  }
}

// Sends the proposal to the selected landlords (those who can't accept it are left out and reported).
export async function sendBulkProposalsAction(input: {
  landlordProfileIds: number[];
  packageId: number;
  message: string;
  staffNote: string;
  expiresInDays: number | null;
}): Promise<{ ok: true; result: BulkSendResult } | ActionFailure> {
  const session = await requireAdmin();

  const { can } = await getPermissions(session);
  if (!can(PERMISSIONS.subscriptionsChange)) return { error: "Your role can't send plan proposals.", expired: false };
  const ids = cleanIds(input.landlordProfileIds);
  if (!ids) return { error: "Select between 1 and 500 landlords.", expired: false };
  const days = input.expiresInDays === null ? null : Number(input.expiresInDays);
  if (days !== null && (!Number.isInteger(days) || days < 1 || days > 90)) {
    return { error: "A proposal can stay open for 1 to 90 days.", expired: false };
  }

  try {
    const result = await sendProposals(session.backendToken, {
      landlordProfileIds: ids,
      toPackageId: Number(input.packageId),
      message: String(input.message ?? "").trim().slice(0, 500),
      staffNote: String(input.staffNote ?? "").trim().slice(0, 500),
      expiresInDays: days,
    });
    return { ok: true, result };
  } catch (err) {
    return failure(err, "Couldn't send the proposals. Try again.");
  }
}
