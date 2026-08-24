import Link from "next/link";
import { listProperties } from "@/lib/data/store";

export default function PropertiesPage() {
  const properties = listProperties();

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-head text-2xl font-bold text-heading">Properties</h1>
        <Link
          href="/admin/properties/new"
          className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-accent-dark"
        >
          Add property
        </Link>
      </div>

      {properties.length === 0 ? (
        <p className="text-muted">No properties yet.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-subtle bg-surface shadow-sm">
          {properties.map((property) => (
            <Link
              key={property.id}
              href={`/admin/properties/${property.id}`}
              className="flex items-center justify-between gap-4 border-t border-subtle px-5 py-4 first:border-t-0 hover:bg-subtle/60"
            >
              <div>
                <p className="font-semibold text-heading">{property.address}</p>
                <p className="text-sm text-muted">{property.city}</p>
              </div>
              <span className="text-sm font-semibold text-heading">
                ${property.rentAmount}/mo
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}