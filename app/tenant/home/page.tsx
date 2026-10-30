// "My home": the tenant's current homes with their lease terms, and past homes. Moved off the dashboard so the dashboard can stay a summary.
import { redirect } from "next/navigation";
import { TenantPageHeading } from "@/components/tenant-page-heading";
import { SessionExpiredError } from "@/lib/api-error";
import { requireBackendToken } from "@/lib/auth-guard";
import { getMyLease } from "@/lib/tenancy-api";
import { getMyTenancies } from "@/lib/tenant-api";
import type { TenantTenancy } from "@/lib/types";
import { CurrentHomeCard, PastHomeRow } from "../tenancy-card";
import { LeaseCard } from "../lease-card";

export default async function TenantHomesPage() {
  const session = await requireBackendToken(["Tenant"]);
  const token = session.backendToken;

  let tenancies: TenantTenancy[] | null = null;
  let loadError = "";
  try {
    tenancies = await getMyTenancies(token);
  } catch (err) {
    if (err instanceof SessionExpiredError) redirect("/session-expired");
    loadError = err instanceof Error ? err.message : "Couldn't load your home. Please try again.";
  }

  const current = tenancies?.filter((tenancy) => tenancy.status === "Active") ?? [];
  const past = tenancies?.filter((tenancy) => tenancy.status !== "Active") ?? [];
  // The lease terms for each current home. A failed lookup just leaves that card out.
  const leases = await Promise.all(current.map((tenancy) => getMyLease(token, tenancy.tenancyId).catch(() => null)));

  return (
    <div>
      <TenantPageHeading title="My home" description="Where you live, your lease terms and your landlord's contact details." />

      {loadError && <p className="mb-6 rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">{loadError}</p>}

      {tenancies && (
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 text-sm font-semibold text-heading">Where I live</h2>
            {current.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                {current.map((tenancy) => (
                  <CurrentHomeCard key={tenancy.tenancyId} tenancy={tenancy} />
                ))}
              </div>
            ) : (
              <div className="max-w-2xl rounded-2xl border border-default bg-white p-8 text-center shadow-sm">
                <p className="text-sm font-medium text-heading">{past.length > 0 ? "No active home" : "No homes yet"}</p>
                <p className="mt-1 text-sm text-muted">Once a landlord&apos;s invite is accepted, your home shows up here.</p>
              </div>
            )}
          </section>

          {leases.some(Boolean) && (
            <section>
              <h2 className="mb-3 text-sm font-semibold text-heading">My lease</h2>
              <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                {current.map((tenancy, index) => {
                  const lease = leases[index];
                  return lease ? <LeaseCard key={tenancy.tenancyId} lease={lease} homeName={`${tenancy.property.name}, ${tenancy.unit.label}`} /> : null;
                })}
              </div>
            </section>
          )}

          {past.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold text-heading">Past homes</h2>
              <div className="grid gap-3 md:grid-cols-2">
                {past.map((tenancy) => (
                  <PastHomeRow key={tenancy.tenancyId} tenancy={tenancy} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
