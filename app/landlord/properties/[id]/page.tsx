import { notFound } from "next/navigation";
import { requireBackendToken } from "@/lib/auth-guard";
import { backendFetch } from "@/lib/api-client";
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
      <h1 className="mb-2 text-2xl font-bold">{property.name}</h1>
      <p className="text-muted">
        {property.line1}
        {property.line2 ? `, ${property.line2}` : ""}, {property.city}, {property.region}{" "}
        {property.postalCode}
      </p>
    </div>
  );
}