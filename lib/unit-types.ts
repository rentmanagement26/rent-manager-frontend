import { backendFetch } from "@/lib/api-client";
import type { UnitType } from "@/lib/types";

export async function getUnitTypes(token: string): Promise<UnitType[]> {
  const response = await backendFetch("/api/v1/properties/unit-types", token);
  if (!response.ok) {
    throw new Error("Failed to load unit types");
  }
  return response.json();
}

export async function getUnitStatuses(token: string): Promise<string[]> {
  const response = await backendFetch("/api/v1/properties/unit-statuses", token);
  if (!response.ok) {
    throw new Error("Failed to load unit statuses");
  }
  return response.json();
}