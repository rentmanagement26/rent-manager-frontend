import { notFound } from "next/navigation";
import { getProperty } from "@/lib/data/store";

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = getProperty(id);

  if (!property) {
    notFound();
  }

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