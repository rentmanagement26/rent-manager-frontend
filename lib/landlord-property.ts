// Finds which of the landlord's properties holds a unit, so tenancy pages can show its name, address and province.
import { backendFetch } from "@/lib/api-client";
import { SessionExpiredError } from "@/lib/api-error";
import type { Property, Unit } from "@/lib/types";

export interface UnitContext {
  property: Property;
  unit: Unit;
}

// Null when the unit is not in the landlord's properties (for example it was archived).
export async function findUnitContext(token: string, unitId: number): Promise<UnitContext | null> {
  const response = await backendFetch("/api/v1/properties/mine", token, { cache: "no-store" });
  if (response.status === 401) throw new SessionExpiredError();
  if (!response.ok) throw new Error("Couldn't load your properties.");

  const properties: Property[] = await response.json();
  for (const property of properties) {
    const unit = property.units.find((candidate) => candidate.id === unitId);
    if (unit) return { property, unit };
  }
  return null;
}
