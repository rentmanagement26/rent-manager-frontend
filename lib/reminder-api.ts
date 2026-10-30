// Backend calls for the landlord's renewal reminder settings (GET and PUT /lease-reminders/settings). Reading is open to every landlord;
// saving needs the plan feature "leases.renewal_reminders" (the backend answers 403 feature_not_included without it).
import { backendFetch } from "@/lib/api-client";
import { SessionExpiredError, extractErrorMessage } from "@/lib/api-error";

export interface ReminderSettings {
  // False when the landlord's plan has no reminders, so the screen can show it locked.
  available: boolean;
  enabled: boolean;
  email: boolean;
  inApp: boolean;
  // The usual notice period in days (14 to 365).
  noticeDays: number;
  // Days before the end date to remind on, for example 120, 90, 60, 30, 7.
  stages: number[];
  // Also remind on the end day and a week after, when no decision was made.
  overdueAlerts: boolean;
}

const URL = "/api/v1/lease-reminders/settings";

// The backend answers { code, message } for refusals; fall back to the shared reader for anything else.
async function errorText(response: Response): Promise<string> {
  try {
    const body = (await response.clone().json()) as { message?: string };
    if (typeof body.message === "string" && body.message) return body.message;
  } catch {
    // Not JSON: use the shared reader below.
  }
  return extractErrorMessage(response);
}

export async function getReminderSettings(token: string): Promise<ReminderSettings> {
  const response = await backendFetch(URL, token, { cache: "no-store" });
  if (response.status === 401) throw new SessionExpiredError();
  if (!response.ok) throw new Error(await errorText(response));
  return response.json();
}

// With enabled false the backend saves only the switch and keeps the earlier choices.
export async function saveReminderSettings(token: string, settings: Omit<ReminderSettings, "available">): Promise<void> {
  const response = await backendFetch(URL, token, {
    method: "PUT",
    body: JSON.stringify({
      Enabled: settings.enabled,
      Email: settings.email,
      InApp: settings.inApp,
      NoticeDays: settings.noticeDays,
      Stages: settings.stages,
      OverdueAlerts: settings.overdueAlerts,
    }),
  });
  if (response.status === 401) throw new SessionExpiredError();
  if (!response.ok) throw new Error(await errorText(response));
}
