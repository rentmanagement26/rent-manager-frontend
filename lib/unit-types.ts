import { backendFetch } from "@/lib/api-client";
import type { UnitType } from "@/lib/types";

export async function getUnitTypes(token: string): Promise<UnitType[]> {
  const response = await backendFetch("/api/properties/unit-types", token);
  if (!response.ok) {
    throw new Error("Failed to load unit types");
  }
  return response.json();
}