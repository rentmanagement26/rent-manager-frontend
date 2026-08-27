import Link from "next/link";
import { notFound } from "next/navigation";
import { requireBackendToken } from "@/lib/auth-guard";
import { backendFetch } from "@/lib/api-client";
import { PageHeader } from "@/components/page-header";
import type { Property } from "@/lib/types";

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireBackendToken(["Admin", "Landlord"]);
  const response = await backendFetch(`/api/properties/${id}`, session.backendToken);

  if (response.status === 404) {
    notFound();
  }

  const property: Property = await response.json();

  return (
    <div>
      <PageHeader
        title={property.name}
        description={property.propertyType}
    
      />

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
        <div className="bg-white rounded-2xl border border-default shadow-sm p-6">
          <p className="text-sm font-medium text-muted mb-3">Address</p>
          <p className="text-heading">
            {property.line1}
            {property.line2 ? `, ${property.line2}` : ""}
          </p>
          <p className="text-heading">
            {property.city}, {property.region} {property.postalCode}
          </p>
          <p className="text-muted">{property.country}</p>

          <div className="mt-6 pt-5 border-t border-default">
            <p className="text-sm font-medium text-muted mb-3">Units</p>
            {property.units.length === 0 ? (
              <p className="text-muted">
                No units yet.{" "}
                <Link
                  href={`/landlord/properties/${property.id}/units/new`}
                  className="text-accent hover:text-accent-dark"
                >
                  Add the first one
                </Link>
                .
              </p>
            ) : (
              <p className="text-heading">
                {property.units.length} unit{property.units.length === 1 ? "" : "s"}
              </p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-default shadow-sm p-5">
          <p className="text-sm text-muted mb-4">Property type</p>
          <span className="text-sm px-3 py-1.5 rounded bg-accent-tint text-accent-dark">
            {property.propertyType}
          </span>

          <div className="mt-6 pt-5 border-t border-default">
            <Link
              href="/landlord/properties"
              className="block rounded-lg border border-default px-4 py-2.5 text-sm font-medium text-heading text-center hover:bg-subtle"
            >
              Back to properties
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}