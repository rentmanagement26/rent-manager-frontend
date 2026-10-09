"use server";

import { SessionExpiredError } from "@/lib/api-error";
import { requireBackendToken } from "@/lib/auth-guard";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/notifications-api";
import type { ActionFailure } from "@/lib/types";

export async function markNotificationReadAction(id: number): Promise<{ ok: true } | ActionFailure> {
  const session = await requireBackendToken();

  try {
    await markNotificationRead(session.backendToken, Number(id));
    return { ok: true };
  } catch (err) {
    if (err instanceof SessionExpiredError) {
      return { error: err.message, expired: true };
    }
    return { error: "Couldn't mark that notification as read.", expired: false };
  }
}

export async function markAllNotificationsReadAction(): Promise<{ ok: true } | ActionFailure> {
  const session = await requireBackendToken();

  try {
    await markAllNotificationsRead(session.backendToken);
    return { ok: true };
  } catch (err) {
    if (err instanceof SessionExpiredError) {
      return { error: err.message, expired: true };
    }
    return { error: "Couldn't mark your notifications as read.", expired: false };
  }
}
