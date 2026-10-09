"use server";

import { removeAuditOverride, setAuditMode } from "@/lib/audit-api";
import { SessionExpiredError } from "@/lib/api-error";
import { requireAdmin } from "@/lib/auth-guard";
import type { ActionFailure, AuditMode } from "@/lib/types";

const MODES: AuditMode[] = ["Disabled", "Summary", "Full"];

function failure(err: unknown, fallback: string): ActionFailure {
  if (err instanceof SessionExpiredError) {
    return { error: err.message, expired: true };
  }
  return { error: err instanceof Error ? err.message : fallback, expired: false };
}

export async function setAuditModeAction(key: string, mode: AuditMode): Promise<{ ok: true } | ActionFailure> {
  const session = await requireAdmin();
  if (!MODES.includes(mode)) {
    return { error: "Unknown audit mode.", expired: false };
  }

  try {
    await setAuditMode(session.backendToken, String(key), mode);
    return { ok: true };
  } catch (err) {
    return failure(err, "Couldn't save that change. Try again.");
  }
}

export async function removeAuditOverrideAction(key: string): Promise<{ ok: true } | ActionFailure> {
  const session = await requireAdmin();

  try {
    await removeAuditOverride(session.backendToken, String(key));
    return { ok: true };
  } catch (err) {
    return failure(err, "Couldn't reset that setting. Try again.");
  }
}
