import Link from "next/link";
import { notFound } from "next/navigation";
import { requireBackendToken } from "@/lib/auth-guard";
import { backendFetch } from "@/lib/api-client";
import { getUnitMedia } from "@/lib/media-api";
import { PageHeader } from "@/components/page-header";
import { PhotoStrip } from "./photo-strip";
import { ArchiveUnitButton } from "./archive-unit-button";
import type { Unit } from "@/lib/types";

export default async function UnitDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; unitId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id, unitId } = await params;
  const { error } = await searchParams;
  const session = await requireBackendToken(["Admin", "Landlord"]);
  const response = await backendFetch(`/api/v1/properties/units/${unitId}`, session.backendToken);

  if (response.status === 404) {
    notFound();
  }

  const unit: Unit = await response.json();
  const photos = await getUnitMedia(unit.id, session.backendToken);

  return (
    <div>
      <PageHeader title={unit.label} description={unit.unitType} />

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
        <div className="bg-white rounded-2xl border border-default shadow-sm p-6">
          <PhotoStrip unitId={unit.id} photos={photos} />

          <div className="mt-6 pt-5 border-t border-default grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted">Bedrooms</p>
              <p className="text-heading font-medium">{unit.bedrooms}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Bathrooms</p>
              <p className="text-heading font-medium">{unit.bathrooms}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Square feet</p>
              <p className="text-heading font-medium">{unit.squareFeet}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Asking rent</p>
              <p className="text-heading font-medium">${unit.askingRent.toLocaleString()}/mo</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-default shadow-sm p-5">
          <p className="text-sm text-muted mb-4">Status</p>
          <span className="text-sm px-3 py-1.5 rounded bg-accent-tint text-accent-dark">
            {unit.status}
          </span>

          <div className="mt-6 pt-5 border-t border-default flex flex-col gap-2">
            <Link
              href={`/landlord/properties/${id}/units/${unit.id}/edit`}
              className="block rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white text-center hover:bg-accent-dark"
            >
              Edit unit
            </Link>
            <Link
              href={`/landlord/properties/${id}`}
              className="block rounded-lg border border-default px-4 py-2.5 text-sm font-medium text-heading text-center hover:bg-subtle"
            >
              Back to property
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white rounded-2xl border border-default shadow-sm p-6">
        <p className="text-sm font-medium text-muted mb-3">Danger zone</p>
        <ArchiveUnitButton propertyId={Number(id)} unitId={unit.id} />
      </div>
    </div>
  );
}