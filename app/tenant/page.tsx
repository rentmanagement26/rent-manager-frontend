// The tenant home, in the same style as the landlord dashboard: a greeting, number tiles, then cards for the homes, leases, documents and contacts.
import Link from "next/link";
import { redirect } from "next/navigation";
import { LandlordContactCard, TenantDocumentsCard, TenantHomesCard, TenantRentSoonCard } from "@/components/tenant-dashboard-cards";
import { StatTile } from "@/components/dashboard-cards";
import { SessionExpiredError } from "@/lib/api-error";
import { requireBackendToken } from "@/lib/auth-guard";
import { listDocuments } from "@/lib/document-api";
import { getFirstName } from "@/lib/format-name";
import { formatMoney, ordinal } from "@/lib/lease-format";
import { getMyLease } from "@/lib/tenancy-api";
import { getMyTenancies } from "@/lib/tenant-api";
import type { TenantTenancy } from "@/lib/types";

// The next date a rent due day falls on: this month if the day has not passed, otherwise next month.
function nextDueDate(day: number): Date {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth() + (today.getDate() <= day ? 0 : 1), day);
}

export default async function TenantHomePage() {
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
  // The lease terms for each current home, and the documents sent to this tenant. A failed lookup just leaves that part out.
  const [leases, documents] = await Promise.all([
    Promise.all(current.map((tenancy) => getMyLease(token, tenancy.tenancyId).catch(() => null))),
    listDocuments(token).catch(() => []),
  ]);
  const toSign = documents.filter((document) => document.status === "AwaitingTenants" && document.yourStatus === "Pending");
  const firstName = getFirstName(session.fullName);

  // Number tiles: homes, the rent agreed in the leases, the next rent due day, and leases waiting for a signature.
  const rents = leases.map((lease) => lease?.monthlyRent ?? null).filter((rent): rent is number => rent !== null && rent > 0);
  const totalRent = rents.reduce((sum, rent) => sum + rent, 0);
  const dueDays = leases.map((lease) => lease?.rentDueDay ?? null).filter((day): day is number => day !== null);
  const soonestDue =
    dueDays.length > 0
      ? dueDays
          .map((day) => ({ day, date: nextDueDate(day) }))
          .sort((a, b) => a.date.getTime() - b.date.getTime())
          .map(({ day, date }) => ({ day, label: date.toLocaleDateString("en-CA", { month: "short", day: "numeric" }) }))[0]
      : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-head text-2xl font-bold text-heading">Hello{firstName ? ` ${firstName}` : ""},</h1>
          <p className="mt-1 text-sm text-muted">Your home, your lease and your documents in one place.</p>
        </div>
        <Link href="/tenant/documents" className="rounded-full border border-default bg-white px-4 py-2 text-sm font-semibold text-heading hover:bg-subtle">
          Documents
        </Link>
      </div>

      {toSign.length > 0 && (
        <Link href={`/tenant/documents/${toSign[0].id}`} className="flex items-center justify-between gap-3 rounded-2xl border border-accent bg-accent-tint px-5 py-4 text-sm">
          <span className="font-semibold text-accent-dark">
            {toSign.length === 1 ? `Your lease "${toSign[0].title}" is waiting for your signature` : `${toSign.length} leases are waiting for your signature`}
          </span>
          <span className="font-semibold text-accent">Read and sign</span>
        </Link>
      )}

      {loadError && <p className="rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">{loadError}</p>}

      {tenancies && (
        <>
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <StatTile label="Homes" value={current.length} note={past.length > 0 ? `${past.length} past` : "where you live now"} />
            <StatTile label="Monthly rent" value={rents.length > 0 ? formatMoney(totalRent) : "Not set"} note={rents.length > 0 ? "from your lease" : "your landlord has not set it"} />
            <StatTile label="Next rent due" value={soonestDue ? soonestDue.label : "Not set"} note={soonestDue ? `due on the ${ordinal(soonestDue.day)}` : "no due day yet"} />
            <StatTile label="To sign" value={toSign.length} note={toSign.length === 1 ? "lease waiting" : "leases waiting"} />
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <div className="space-y-6 xl:col-span-2">
              <TenantHomesCard tenancies={current} leases={leases} />
              <TenantDocumentsCard documents={documents} />
            </div>
            <div className="space-y-6">
              <LandlordContactCard tenancies={current} />
              <TenantRentSoonCard />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
