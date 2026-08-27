"use client";

import { useState } from "react";
import Link from "next/link";
import type { Property } from "@/lib/types";

export function PropertiesGrid({ properties }: { properties: Property[] }) {
  const [search, setSearch] = useState("");

  const query = search.trim().toLowerCase();
  const filtered = query
    ? properties.filter(
        (property) =>
          property.name.toLowerCase().includes(query) ||
          property.city.toLowerCase().includes(query)
      )
    : properties;

  if (properties.length === 0) {
    return <p className="text-muted">No properties yet.</p>;
  }

  return (
    <div>
      <input
        type="text"
        placeholder="Search by name or city..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-6 w-full max-w-sm rounded-lg border border-default px-3 py-2.5 text-sm text-heading placeholder:text-muted focus:outline-none focus:border-accent"
      />

      {filtered.length === 0 ? (
        <p className="text-muted">No properties match &quot;{search}&quot;.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((property) => (
            <div
              key={property.id}
              className="rounded-2xl border border-default bg-white shadow-sm p-5 flex flex-col gap-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="w-12 h-12 rounded-lg bg-accent-tint text-accent-dark flex items-center justify-center text-lg font-bold shrink-0">
                  🏢
                </div>
                <span className="shrink-0 text-xs px-2.5 py-1 rounded bg-accent-tint text-accent-dark font-medium">
                  {property.propertyType}
                </span>
              </div>

              <div className="min-w-0">
                <p className="font-semibold text-heading truncate">{property.name}</p>
                <p className="text-sm text-muted truncate">
                  {property.line1}, {property.city}, {property.region}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-default">
                <span className="text-sm text-muted">
                  {property.units.length} unit{property.units.length === 1 ? "" : "s"}
                </span>
              </div>

              <div className="flex gap-2">
                <Link
                  href={`/landlord/properties/${property.id}/units/new`}
                  className="flex-1 rounded-lg border border-default px-3 py-2 text-center text-sm font-medium text-heading hover:bg-subtle"
                >
                  Add unit
                </Link>
                <Link
                  href={`/landlord/properties/${property.id}`}
                  className="flex-1 rounded-lg bg-accent px-3 py-2 text-center text-sm font-semibold text-white hover:bg-accent-dark"
                >
                  View
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}