"use server";

// Server action for switching a customer's account on or off. SuperAdmin only; the backend enforces it as well.
import { SessionExpiredError } from "@/lib/api-error";
import { requireAdmin } from "@/lib/auth-guard";
import { setCustomerActive } from "@/lib/customer-api";
import { getPermissions, PERMISSIONS } from "@/lib/permissions";
import type { ActionFailure } from "@/lib/types";

export async function setCustomerActiveAction(userId: string, active: boolean): Promise<{ ok: true } | ActionFailure> {
  const session = await requireAdmin();

  const { can } = await getPermissions(session);
  if (!can(PERMISSIONS.customersManage)) return { error: "Your role can't switch customer accounts on or off.", expired: false };

  try {
    await setCustomerActive(session.backendToken, String(userId), active === true);
    return { ok: true };
  } catch (err) {
    if (err instanceof SessionExpiredError) return { error: err.message, expired: true };
    return { error: err instanceof Error ? err.message : "Couldn't change the account. Try again.", expired: false };
  }
}
