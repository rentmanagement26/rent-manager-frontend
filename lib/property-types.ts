import { backendFetch } from "@/lib/api-client";
import type { PropertyType } from "@/lib/types";

export async function getPropertyTypes(token: string): Promise<PropertyType[]> {
  const response = await backendFetch("/api/properties/property-types", token);
  if (!response.ok) {
    throw new Error("Failed to load property types");
  }
  return response.json();
}