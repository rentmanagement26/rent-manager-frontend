import Link from "next/link";
import { requireBackendToken } from "@/lib/auth-guard";
import { backendFetch } from "@/lib/api-client";
import { PageHeader } from "@/components/page-header";
import { InviteTenantForm } from "./invite-tenant-form";
import type { Property } from "@/lib/types";

export default async function TenantsPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; email?: string; error?: string }>;
}) {
  const { sent, email, error } = await searchParams;
  const session = await requireBackendToken(["Admin", "Landlord"]);
  const response = await backendFetch("/api/v1/properties/mine", session.backendToken);
  const properties: Property[] = await response.json();

  const hasUnits = properties.some((p) => p.units.length > 0);

  return (
    <div>
      <PageHeader title="Invite a tenant" description="Send an invite so a tenant can access their unit." />

      {sent === "1" && email && (
        <p className="mb-4 rounded-lg bg-green-50 px-3 py-2.5 text-sm font-medium text-green-700">
          Invite sent to {email}.
        </p>
      )}

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      {hasUnits ? (
        <InviteTenantForm properties={properties} />
      ) : (
        <div className="bg-white rounded-2xl border border-default shadow-sm p-6 text-center">
          <p className="text-muted mb-4">Add a property and unit before inviting a tenant.</p>
          <Link
            href="/landlord/properties/new"
            className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-accent-dark"
          >
            Add property
          </Link>
        </div>
      )}
    </div>
  );
}