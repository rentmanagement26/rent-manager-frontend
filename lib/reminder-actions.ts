"use server";

// Server action for the reminder settings form: saves the landlord's choices and answers { ok } or { error, expired }.
import { SessionExpiredError } from "@/lib/api-error";
import { requireBackendToken } from "@/lib/auth-guard";
import { saveReminderSettings, type ReminderSettings } from "@/lib/reminder-api";

export async function saveReminderSettingsAction(
  settings: Omit<ReminderSettings, "available">
): Promise<{ ok: true } | { error: string; expired: boolean }> {
  const session = await requireBackendToken(["Admin", "Landlord"]);

  // Checked here as well as by the backend, so a bad value gets a plain message.
  if (!Number.isInteger(settings.noticeDays) || settings.noticeDays < 14 || settings.noticeDays > 365) {
    return { error: "The notice period must be 14 to 365 days.", expired: false };
  }
  if (settings.enabled && !settings.email && !settings.inApp) {
    return { error: "Choose email, in the app, or both.", expired: false };
  }

  try {
    await saveReminderSettings(session.backendToken, {
      enabled: Boolean(settings.enabled),
      email: Boolean(settings.email),
      inApp: Boolean(settings.inApp),
      noticeDays: settings.noticeDays,
      stages: settings.stages.map(Number),
      overdueAlerts: Boolean(settings.overdueAlerts),
    });
    return { ok: true };
  } catch (err) {
    if (err instanceof SessionExpiredError) return { error: err.message, expired: true };
    return { error: err instanceof Error ? err.message : "Couldn't save the settings. Please try again.", expired: false };
  }
}
