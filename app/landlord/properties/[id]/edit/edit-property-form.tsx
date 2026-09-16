"use client";

import { useState } from "react";
import Link from "next/link";
import { updatePropertyAction } from "../../actions";
import { PageHeader } from "@/components/page-header";
import type { Property, PropertyType } from "@/lib/types";

export function EditPropertyForm({
  property,
  propertyTypes,
  error,
}: {
  property: Property;
  propertyTypes: PropertyType[];
  error?: string;
}) {
  const [name, setName] = useState(property.name);
  const [propertyTypeId, setPropertyTypeId] = useState(
    propertyTypes.find((t) => t.name === property.propertyType)?.id ?? propertyTypes[0]?.id ?? 0
  );
  const [line1, setLine1] = useState(property.line1);
  const [city, setCity] = useState(property.city);
  const [region, setRegion] = useState(property.region);
  const [postalCode, setPostalCode] = useState(property.postalCode);

  const selectedType = propertyTypes.find((t) => t.id === propertyTypeId);

  const inputClass =
    "rounded-lg border border-default px-3 py-2.5 text-sm text-heading placeholder:text-muted focus:outline-none focus:border-accent";
  const labelClass = "text-sm font-medium text-heading";

  return (
    <div>
      <PageHeader title="Edit property" description="Update this property's details." />

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
        <div className="bg-white rounded-2xl border border-default shadow-sm p-6">
          {error && (
            <p className="mb-4 rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">
              {error}
            </p>
          )}

          <form action={updatePropertyAction} className="flex flex-col gap-4">
            <input type="hidden" name="propertyId" value={property.id} />

            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className={labelClass}>Property name</label>
              <input
                id="name"
                name="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="propertyTypeId" className={labelClass}>Property type</label>
              <select
                id="propertyTypeId"
                name="propertyTypeId"
                value={propertyTypeId}
                onChange={(e) => setPropertyTypeId(Number(e.target.value))}
                className={inputClass}
              >
                {propertyTypes.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="line1" className={labelClass}>Address line 1</label>
              <input
                id="line1"
                name="line1"
                required
                value={line1}
                onChange={(e) => setLine1(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="line2" className={labelClass}>Address line 2</label>
              <input
                id="line2"
                name="line2"
                defaultValue={property.line2 ?? ""}
                placeholder="Unit, suite, etc. (optional)"
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="city" className={labelClass}>City</label>
                <input
                  id="city"
                  name="city"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="region" className={labelClass}>Province</label>
                <input
                  id="region"
                  name="region"
                  required
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="postalCode" className={labelClass}>Postal code</label>
                <input
                  id="postalCode"
                  name="postalCode"
                  required
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="country" className={labelClass}>Country</label>
                <input
                  id="country"
                  name="country"
                  defaultValue={property.country}
                  disabled
                  className={`${inputClass} bg-subtle text-muted`}
                />
              </div>
            </div>

            <div className="mt-2 pt-4 border-t border-default flex justify-end gap-3">
              <Link
                href={`/landlord/properties/${property.id}`}
                className="rounded-lg border border-default px-4 py-2.5 text-sm font-medium text-heading hover:bg-subtle"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark"
              >
                Save changes
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-2xl border border-default shadow-sm p-5">
          <p className="text-sm text-muted mb-4">Preview</p>
          <div className="rounded-lg border border-default p-4 flex gap-3 items-center">
            <div className="w-12 h-12 rounded-lg bg-accent-tint text-accent-dark flex items-center justify-center text-lg font-bold shrink-0">
              🏢
            </div>
            <div className="min-w-0">
              <p className="text-base font-medium text-heading truncate">{name || "Property name"}</p>
              <p className="text-sm text-muted truncate">
                {line1 || "Address"}{city ? `, ${city}` : ""}{region ? `, ${region}` : ""}
              </p>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <span className="text-sm px-3 py-1.5 rounded bg-accent-tint text-accent-dark">
              {selectedType?.name}
            </span>
            {postalCode && (
              <span className="text-sm px-3 py-1.5 rounded bg-subtle text-muted">
                {postalCode}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
