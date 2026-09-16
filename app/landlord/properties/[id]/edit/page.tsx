import { notFound } from "next/navigation";
import { requireBackendToken } from "@/lib/auth-guard";
import { backendFetch } from "@/lib/api-client";
import { getPropertyTypes } from "@/lib/property-types";
import { EditPropertyForm } from "./edit-property-form";
import type { Property } from "@/lib/types";

export default async function EditPropertyPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const session = await requireBackendToken(["Admin", "Landlord"]);

  const [propertyResponse, propertyTypes] = await Promise.all([
    backendFetch(`/api/v1/properties/${id}`, session.backendToken),
    getPropertyTypes(session.backendToken),
  ]);

  if (propertyResponse.status === 404) {
    notFound();
  }

  const property: Property = await propertyResponse.json();

  return <EditPropertyForm property={property} propertyTypes={propertyTypes} error={error} />;
}
