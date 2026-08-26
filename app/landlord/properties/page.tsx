import Link from "next/link";
import { listProperties } from "@/lib/data/store";
import { PageHeader } from "@/components/page-header";

export default function PropertiesPage() {
  const properties = listProperties();

  return (
    <div>
  
        <PageHeader
          title="Properties"
          description="Every property in your portfolio, in one place."
          action={
            <Link
              href="/landlord/properties/new"
              className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-accent-dark"
            >
              Add property
            </Link>
          }
        />
  

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