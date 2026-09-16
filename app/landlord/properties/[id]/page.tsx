import Link from "next/link";
import { notFound } from "next/navigation";
import { requireBackendToken } from "@/lib/auth-guard";
import { backendFetch } from "@/lib/api-client";
import { PageHeader } from "@/components/page-header";
import type { Property } from "@/lib/types";
import { PhotoCarousel } from "./photo-carousel";
import { getPropertyMedia } from "@/lib/media-api";
import { ArchivePropertyButton } from "./archive-property-button";

export default async function PropertyDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; unitArchived?: string }>;
}) {
  const { id } = await params;
  const { error, unitArchived } = await searchParams;
  const session = await requireBackendToken(["Admin", "Landlord"]);
     const response = await backendFetch(`/api/v1/properties/${id}`, session.backendToken);

  if (response.status === 404) {
    notFound();
  }

  const property: Property = await response.json();
  const photos = await getPropertyMedia(property.id, session.backendToken);


  return (
    <div>
          <PageHeader
        title={property.name}
        description={property.propertyType}
        action={
          <Link
            href={`/landlord/properties/${property.id}/edit`}
            className="rounded-xl border border-default px-4 py-2.5 text-sm font-semibold text-heading hover:bg-subtle whitespace-nowrap"
          >
            Edit
          </Link>
        }
      />

      {unitArchived === "1" && (
        <p className="mb-4 rounded-lg bg-green-50 px-3 py-2.5 text-sm font-medium text-green-700">
          Unit archived.
        </p>
      )}

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      <div className="mb-6">
        <PhotoCarousel propertyId={property.id} photos={photos} />
      </div>

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
            ) :  (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {property.units.map((unit) => (
                  <div
                    key={unit.id}
                    className="rounded-xl border border-default p-4 flex flex-col gap-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-heading">{unit.label}</p>
                      <span className="shrink-0 text-xs px-2 py-1 rounded bg-accent-tint text-accent-dark font-medium">
                        {unit.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted">{unit.unitType}</p>
                    <p className="text-sm text-heading">
                      {unit.bedrooms} bd &middot; {unit.bathrooms} ba &middot; {unit.squareFeet} sqft
                    </p>
                    <p className="text-sm font-medium text-heading">
                      ${unit.askingRent.toLocaleString()}/mo
                    </p>

                    <div className="flex gap-2 pt-2">
                      <Link
                        href={`/landlord/properties/${property.id}/units/${unit.id}`}
                        className="flex-1 rounded-lg border border-default px-2.5 py-1.5 text-center text-xs font-medium text-heading hover:bg-subtle"
                      >
                        View
                      </Link>
                      <Link
                        href={`/landlord/properties/${property.id}/units/${unit.id}/edit`}
                        className="flex-1 rounded-lg bg-accent px-2.5 py-1.5 text-center text-xs font-semibold text-white hover:bg-accent-dark"
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
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

      <div className="mt-6 bg-white rounded-2xl border border-default shadow-sm p-6">
        <p className="text-sm font-medium text-muted mb-3">Danger zone</p>
        <ArchivePropertyButton propertyId={property.id} hasActiveUnits={property.units.length > 0} />
      </div>
    </div>
  );
}