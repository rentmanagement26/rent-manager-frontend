import Link from "next/link";
import { requireBackendToken } from "@/lib/auth-guard";
import { backendFetch } from "@/lib/api-client";
import { PageHeader } from "@/components/page-header";
import type { Property } from "@/lib/types";

export default async function PropertiesPage() {
  const session = await requireBackendToken(["Admin", "Landlord"]);
  const response = await backendFetch("/api/properties/mine", session.backendToken);
  const properties: Property[] = await response.json();

  return (
    <div>
      <PageHeader
        title="Properties"
        description="Every property in your portfolio, in one place."
        action={
          <Link
            href="/landlord/properties/new"
            className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-accent-dark"
          >
            Add property
          </Link>
        }
      />

      {properties.length === 0 ? (
        <p className="text-muted">No properties yet.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-subtle bg-surface shadow-sm">
          {properties.map((property) => (
            <Link
              key={property.id}
              href={`/landlord/properties/${property.id}`}
              className="flex items-center justify-between gap-4 border-t border-subtle px-5 py-4 first:border-t-0 hover:bg-subtle/60"
            >
              <div>
                <p className="font-semibold text-heading">{property.name}</p>
                <p className="text-sm text-muted">
                  {property.line1}, {property.city}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}