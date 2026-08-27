"use client";

import { useState } from "react";
import { createUnitAction } from "@/app/landlord/properties/actions";
import { PageHeader } from "@/components/page-header";
import type { UnitType } from "@/lib/types";

export function NewUnitForm({ propertyId, unitTypes }: { propertyId: number; unitTypes: UnitType[] }) {
  const [unitTypeId, setUnitTypeId] = useState(unitTypes[0]?.id ?? 0);
  const [label, setLabel] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [squareFeet, setSquareFeet] = useState("");
  const [askingRent, setAskingRent] = useState("");

  const inputClass =
    "rounded-lg border border-default px-3 py-2.5 text-sm text-heading placeholder:text-muted focus:outline-none focus:border-accent";
  const labelClass = "text-sm font-medium text-heading";

  return (
    <div>

      <PageHeader title="Add property" description="Enter the property's basic details." />


      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
        <div className="bg-white rounded-2xl border border-default shadow-sm p-6">


          <form action={createUnitAction} className="flex flex-col gap-4">
   <input type="hidden" name="propertyId" value={propertyId} />
                   <div className="flex flex-col gap-1.5">
              <label htmlFor="unitTypeId" className={labelClass}>Unit type</label>
              <select
                id="unitTypeId"
                name="unitTypeId"
                value={unitTypeId}
                onChange={(e) => setUnitTypeId(Number(e.target.value))}
                className={inputClass}
              >
                {unitTypes.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="label" className={labelClass}>Label</label>
              <input
                id="label"
                name="label"
                placeholder="Label for the unit (e.g., 1A, 2B, etc.)"
                required
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="bedrooms" className={labelClass}>Bedrooms</label>
              <input
                id="bedrooms"
                name="bedrooms"
                placeholder="Number of bedrooms"
                className={inputClass}
                value={bedrooms}
                onChange={(e) => setBedrooms(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="bathrooms" className={labelClass}>Bathrooms</label>
                <input
                  id="bathrooms"
                  name="bathrooms"
                  placeholder="Number of bathrooms"
                  required
                  value={bathrooms}
                  onChange={(e) => setBathrooms(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="squareFeet" className={labelClass}>Square Feet</label>
                <input
                  id="squareFeet"
                  name="squareFeet"
                  placeholder="1000"
                  required
                  value={squareFeet}
                  onChange={(e) => setSquareFeet(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="postalCode" className={labelClass}>Asking Rent</label>
                <input
                  id="askingRent"
                  name="askingRent"
                  placeholder="1000"
                  required
                  value={askingRent}
                  onChange={(e) => setAskingRent(e.target.value)}
                  className={inputClass}
                />
              </div>
              </div>
              </form>
        </div>
      </div>
    </div>
  );
}