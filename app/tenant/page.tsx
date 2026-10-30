import Link from "next/link";
import { redirect } from "next/navigation";
import { TenantPageHeading } from "@/components/tenant-page-heading";
import { SessionExpiredError } from "@/lib/api-error";
import { requireBackendToken } from "@/lib/auth-guard";
import { getFirstName } from "@/lib/format-name";
import { getMyTenancies } from "@/lib/tenant-api";
import { getMyLease } from "@/lib/tenancy-api";
import { listDocuments } from "@/lib/document-api";
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
  // Leases waiting for this tenant's signature. A failed lookup just hides the banner.
  const toSign = (await listDocuments(session.backendToken).catch(() => [])).filter(
    (document) => document.status === "AwaitingTenants" && document.yourStatus === "Pending"
  );
  const firstName = getFirstName(session.fullName);

  return (
    <div>
      <TenantPageHeading
        title={firstName ? `Welcome back, ${firstName}` : "Welcome back"}
        description="Here's your home and your landlord's contact details."
      />

      {toSign.length > 0 && (
        <Link
          href={`/tenant/documents/${toSign[0].id}`}
          className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-accent bg-accent-tint px-5 py-4 text-sm"
        >
          <span className="font-semibold text-accent-dark">
            {toSign.length === 1 ? `Your lease "${toSign[0].title}" is waiting for your signature` : `${toSign.length} leases are waiting for your signature`}
          </span>
          <span className="font-semibold text-accent">Read and sign</span>
        </Link>
      )}

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
