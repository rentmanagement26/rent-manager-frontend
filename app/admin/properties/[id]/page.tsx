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
      <h1 className="mb-2 text-2xl font-bold">{property.address}</h1>
      <p className="text-muted">{property.city}</p>
      <p className="mt-4 text-lg">${property.rentAmount}/month</p>
    </div>
  );
}