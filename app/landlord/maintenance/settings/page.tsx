// The landlord's maintenance settings: the emergency phone tenants see and the contact contractors see.
import { redirect } from "next/navigation";
import { MaintenanceSettingsForm } from "@/components/maintenance-settings-form";
import { PageHeader } from "@/components/page-header";
import { SessionExpiredError } from "@/lib/api-error";
import { requireBackendToken } from "@/lib/auth-guard";
import { getSettings } from "@/lib/landlord-maintenance-api";
import type { MaintenanceSettings } from "@/lib/landlord-maintenance-types";

export default async function MaintenanceSettingsPage() {
  const session = await requireBackendToken(["Admin", "Landlord"]);

  let settings: MaintenanceSettings;
  try {
    settings = await getSettings(session.backendToken);
  } catch (err) {
    if (err instanceof SessionExpiredError) redirect("/session-expired");
    return <p className="rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">Couldn&apos;t load your settings. Refresh to try again.</p>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Maintenance settings" description="Phone numbers shown to your tenants and your contractors." />
      <MaintenanceSettingsForm settings={settings} />
    </div>
  );
}
