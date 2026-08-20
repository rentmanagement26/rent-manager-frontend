import Link from "next/link";
import { listProperties } from "@/lib/data/store";

export default function PropertiesPage() {
  const properties = listProperties();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Properties</h1>
        <Link
          href="/admin/properties/new"
          className="rounded bg-black px-4 py-2 text-sm text-white"
        >
          Add property
        </Link>
      </div>

      {properties.length === 0 ? (
        <p className="text-gray-500">No properties yet.</p>
      ) : (
        <ul className="divide-y divide-gray-200 rounded border border-gray-200">
          {properties.map((property) => (
            <li key={property.id}>
              <Link
                href={`/admin/properties/${property.id}`}
                className="block px-4 py-3 hover:bg-gray-50"
              >
                <p className="font-medium">{property.address}</p>
                <p className="text-sm text-gray-500">
                  {property.city} — ${property.rentAmount}/mo
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}