import { redirect } from "next/navigation";
import { TenantPageHeading } from "@/components/tenant-page-heading";
import { SessionExpiredError } from "@/lib/api-error";
import { requireBackendToken } from "@/lib/auth-guard";
import { getFirstName } from "@/lib/format-name";
import { getMyTenancies } from "@/lib/tenant-api";
import { getMyLease } from "@/lib/tenancy-api";
import type { TenantTenancy } from "@/lib/types";
import { CurrentHomeCard, PastHomeRow } from "./tenancy-card";
import { TenantQuickLinks } from "./tenant-quick-links";
import { LeaseCard } from "./lease-card";

export default async function TenantHomePage() {
  const session = await requireBackendToken(["Tenant"]);

  let tenancies: TenantTenancy[] | null = null;
  let loadError = "";
  try {
    tenancies = await getMyTenancies(session.backendToken);
  } catch (err) {
    if (err instanceof SessionExpiredError) {
      redirect("/session-expired");
    }
    loadError = err instanceof Error ? err.message : "Couldn't load your home. Please try again.";
  }

  const current = tenancies?.filter((tenancy) => tenancy.status === "Active") ?? [];
  const past = tenancies?.filter((tenancy) => tenancy.status !== "Active") ?? [];
  // The lease terms for each current home. A failed lookup just leaves that card out.
  const leases = await Promise.all(
    current.map((tenancy) => getMyLease(session.backendToken, tenancy.tenancyId).catch(() => null))
  );
  const firstName = getFirstName(session.fullName);

  return (
    <div>
      <TenantPageHeading
        title={firstName ? `Welcome back, ${firstName}` : "Welcome back"}
        description="Here's your home and your landlord's contact details."
      />

      {loadError && (
        <p className="mb-6 rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">{loadError}</p>
      )}

      {tenancies && (
        <div className="grid gap-6 xl:grid-cols-3">
          <div className="space-y-8 xl:col-span-2">
            <section>
              <h2 className="mb-3 text-sm font-semibold text-heading">My home</h2>
              {current.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                  {current.map((tenancy) => (
                    <CurrentHomeCard key={tenancy.tenancyId} tenancy={tenancy} />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-default bg-white p-8 text-center shadow-sm">
                  <p className="text-sm font-medium text-heading">
                    {past.length > 0 ? "No active home" : "No homes yet"}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    Once a landlord&apos;s invite is accepted, your home shows up here.
                  </p>
                </div>
              )}
            </section>

            {leases.some(Boolean) && (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                {current.map((tenancy, index) => {
                  const lease = leases[index];
                  return lease ? <LeaseCard key={tenancy.tenancyId} lease={lease} homeName={`${tenancy.property.name}, ${tenancy.unit.label}`} /> : null;
                })}
              </div>
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

          <div className="space-y-6">
            <TenantQuickLinks />
            <section className="rounded-2xl border border-dashed border-default bg-white/60 p-5">
              <h2 className="text-sm font-semibold text-heading">Rent and payments</h2>
              <p className="mt-1 text-sm text-muted">
                Paying rent online will appear here once it is available.
              </p>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
