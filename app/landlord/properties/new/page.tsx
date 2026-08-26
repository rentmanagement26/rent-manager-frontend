"use client";

import { useState } from "react";
import Link from "next/link";
import { createPropertyAction } from "@/app/landlord/properties/actions";
import { PageHeader } from "@/components/page-header";
import { PROPERTY_TYPES } from "@/lib/property-types";

export default function NewPropertyPage() {
  const [name, setName] = useState("");
  const [propertyTypeId, setPropertyTypeId] = useState(PROPERTY_TYPES[0].id);
  const [line1, setLine1] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [postalCode, setPostalCode] = useState("");

  const selectedType = PROPERTY_TYPES.find((t) => t.id === propertyTypeId);

  const inputClass =
    "rounded-lg border border-default px-3 py-2.5 text-sm text-heading placeholder:text-muted focus:outline-none focus:border-accent";
  const labelClass = "text-sm font-medium text-heading";

  return (
    <div>

        <PageHeader title="Add property" description="Enter the property's basic details." />
 

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
        <div className="bg-white rounded-2xl border border-default shadow-sm p-6">
      

          <form action={createPropertyAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className={labelClass}>Property name</label>
              <input
                id="name"
                name="name"
                placeholder="Maple Street Duplex"
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
                {PROPERTY_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="line1" className={labelClass}>Address line 1</label>
              <input
                id="line1"
                name="line1"
                placeholder="123 Maple St"
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
                  placeholder="Toronto"
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
                  placeholder="ON"
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
                  placeholder="M5V 2T6"
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
                  defaultValue="Canada"
                  disabled
                  className={`${inputClass} bg-subtle text-muted`}
                />
              </div>
            </div>

            <div className="mt-2 pt-4 border-t border-default flex justify-end gap-3">
              <Link
                href="/landlord/properties"
                className="rounded-lg border border-default px-4 py-2.5 text-sm font-medium text-heading hover:bg-subtle"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark"
              >
                Add property
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
    {selectedType?.label}
  </span>
  {postalCode && (
    <span className="text-sm px-3 py-1.5 rounded bg-subtle text-muted">
      {postalCode}
    </span>
  )}
</div>

<div className="mt-6 pt-5 border-t border-default">
  <p className="text-sm font-medium text-muted mb-3">What&apos;s next</p>
  <ul className="flex flex-col gap-3 text-sm text-muted">
    <li>Add units to this property</li>
    <li>Invite a tenant</li>
    <li>Create a lease</li>
  </ul>
</div>
        </div>
      </div>
    </div>
  );
}