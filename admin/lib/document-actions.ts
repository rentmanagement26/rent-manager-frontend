"use server";

// Server action for the Documents page. SuperAdmin only; the backend enforces the permission as well.
import { SessionExpiredError } from "@/lib/api-error";
import { requireAdmin } from "@/lib/auth-guard";
import { setProvinceOnlineSigning, type ProvinceSetting } from "@/lib/document-api";
import { getPermissions, PERMISSIONS } from "@/lib/permissions";
import type { ActionFailure } from "@/lib/types";

// Turns online signing on or off for one province and gives back the saved row.
export async function setProvinceAction(code: string, enabled: boolean, note: string): Promise<{ ok: true; setting: ProvinceSetting } | ActionFailure> {
  const session = await requireAdmin();

  const { can } = await getPermissions(session);
  if (!can(PERMISSIONS.documentsManage)) return { error: "Your role can't change online signing.", expired: false };

  try {
    const setting = await setProvinceOnlineSigning(session.backendToken, String(code), Boolean(enabled), String(note));
    return { ok: true, setting };
  } catch (err) {
    if (err instanceof SessionExpiredError) return { error: err.message, expired: true };
    return { error: err instanceof Error ? err.message : "Couldn't save the change. Try again.", expired: false };
  }
}
