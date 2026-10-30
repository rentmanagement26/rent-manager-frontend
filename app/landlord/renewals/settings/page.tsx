// Renewal reminder settings for the landlord. Reading is open to every plan; saving needs the plan feature, so other plans see it locked.
import { redirect } from "next/navigation";
import { requireBackendToken } from "@/lib/auth-guard";
import { SessionExpiredError } from "@/lib/api-error";
import { getReminderSettings } from "@/lib/reminder-api";
import { PageHeader } from "@/components/page-header";
import { ReminderSettingsForm } from "@/components/reminder-settings-form";

export default async function ReminderSettingsPage() {
  const session = await requireBackendToken(["Admin", "Landlord"]);

  let settings;
  try {
    settings = await getReminderSettings(session.backendToken);
  } catch (err) {
    if (err instanceof SessionExpiredError) redirect("/session-expired");
    throw err;
  }

  return (
    <div>
      <PageHeader title="Reminder settings" description="Get reminded before your fixed-term leases end." />
      <ReminderSettingsForm initial={settings} />
    </div>
  );
}
