import { notFound } from "next/navigation";
import { requireBackendToken } from "@/lib/auth-guard";
import { backendFetch } from "@/lib/api-client";
import { getUnitTypes, getUnitStatuses } from "@/lib/unit-types";
import { EditUnitForm } from "./edit-unit-form";
import type { Unit } from "@/lib/types";

export default async function EditUnitPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; unitId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id, unitId } = await params;
  const { error } = await searchParams;
  const session = await requireBackendToken(["Admin", "Landlord"]);

  const [unitResponse, unitTypes, unitStatuses] = await Promise.all([
    backendFetch(`/api/v1/properties/units/${unitId}`, session.backendToken),
    getUnitTypes(session.backendToken),
    getUnitStatuses(session.backendToken),
  ]);

  if (unitResponse.status === 404) {
    notFound();
  }

  const unit: Unit = await unitResponse.json();

  return (
    <EditUnitForm
      propertyId={Number(id)}
      unit={unit}
      unitTypes={unitTypes}
      unitStatuses={unitStatuses}
      error={error}
    />
  );
}
