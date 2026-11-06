// The landlord's "New request" page: create a maintenance request for a unit or a common area (for example one noticed on a visit).
// A unit can be chosen up front with ?unitId=.
import Link from "next/link";
import { redirect } from "next/navigation";
import { NewRequestForm } from "@/components/landlord-new-request-form";
import { PageHeader } from "@/components/page-header";
import { backendFetch } from "@/lib/api-client";
import { SessionExpiredError } from "@/lib/api-error";
import { requireBackendToken } from "@/lib/auth-guard";
import type { Property } from "@/lib/types";

export default async function NewMaintenanceRequestPage({ searchParams }: { searchParams: Promise<{ unitId?: string }> }) {
  const { unitId } = await searchParams;
  const session = await requireBackendToken(["Admin", "Landlord"]);

  let properties: Property[];
  try {
    const response = await backendFetch("/api/v1/properties/mine", session.backendToken, { cache: "no-store" });
    if (response.status === 401) throw new SessionExpiredError();
    if (!response.ok) throw new Error("Could not load properties.");
    properties = await response.json();
  } catch (err) {
    if (err instanceof SessionExpiredError) redirect("/session-expired");
    return <p className="rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">Couldn&apos;t load your properties. Refresh to try again.</p>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="New request" description="Record a problem you found, and share it with the tenants if you like." />
      {properties.length === 0 ? (
        <div className="max-w-2xl rounded-2xl border border-default bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-medium text-heading">Add a property first</p>
          <p className="mt-1 text-sm text-muted">A request belongs to a unit or a common area of one of your properties.</p>
          <Link href="/landlord/properties/new" className="mt-4 inline-block rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark">
            Add property
          </Link>
        </div>
      ) : (
        <NewRequestForm
          properties={properties.map((property) => ({ id: property.id, name: property.name, units: property.units.map((unit) => ({ id: unit.id, label: unit.label })) }))}
          initialUnitId={/^\d+$/.test(unitId ?? "") ? Number(unitId) : null}
        />
      )}
    </div>
  );
}
