// Tenant: "Report a problem". Picks the home (the only active one, or the one in ?tenancyId=), loads what the form needs, and shows the form.
import Link from "next/link";
import { redirect } from "next/navigation";
import { ReportProblemForm } from "@/components/maintenance-report-form";
import { TenantPageHeading } from "@/components/tenant-page-heading";
import { SessionExpiredError } from "@/lib/api-error";
import { requireBackendToken } from "@/lib/auth-guard";
import { getReportForm } from "@/lib/maintenance-api";
import type { ReportForm } from "@/lib/maintenance-types";
import { getMyTenancies } from "@/lib/tenant-api";
import type { TenantTenancy } from "@/lib/types";

export default async function ReportProblemPage({ searchParams }: { searchParams: Promise<{ tenancyId?: string }> }) {
  const { tenancyId } = await searchParams;
  const session = await requireBackendToken(["Tenant"]);

  let homes: TenantTenancy[];
  let form: ReportForm | null = null;
  try {
    homes = (await getMyTenancies(session.backendToken)).filter((home) => home.status === "Active");
    const chosen = homes.find((home) => String(home.tenancyId) === tenancyId) ?? (homes.length === 1 ? homes[0] : undefined);
    if (chosen) form = await getReportForm(session.backendToken, chosen.tenancyId);
  } catch (err) {
    if (err instanceof SessionExpiredError) redirect("/session-expired");
    return <p className="rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">Couldn&apos;t load the form. Refresh to try again.</p>;
  }

  return (
    <div>
      <TenantPageHeading
        title="Report a problem"
        description={form ? form.unitLabel : "Tell your landlord what needs fixing."}
      />
      {/* Above the form on purpose: calling 911 comes before anything else. */}
      <p className="-mt-3 mb-5 text-sm font-semibold text-red-800">If anyone is in danger, call 911 first.</p>

      {form ? (
        <ReportProblemForm form={form} />
      ) : homes.length === 0 ? (
        <div className="max-w-2xl rounded-2xl border border-default bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-medium text-heading">No active home</p>
          <p className="mt-1 text-sm text-muted">You can report a problem once you have an active lease.</p>
        </div>
      ) : (
        <div className="max-w-2xl space-y-3">
          <p className="text-sm text-body">Which home is it for?</p>
          {homes.map((home) => (
            <Link key={home.tenancyId} href={`/tenant/requests/new?tenancyId=${home.tenancyId}`} className="block rounded-2xl border border-default bg-white p-4 shadow-sm hover:border-accent">
              <p className="font-semibold text-heading">{home.unit.label}</p>
              <p className="text-xs text-muted">{home.property.name}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
