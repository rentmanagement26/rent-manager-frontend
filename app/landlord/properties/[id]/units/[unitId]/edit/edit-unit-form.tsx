"use client";

import { useState } from "react";
import Link from "next/link";
import { updateUnitAction } from "@/app/landlord/properties/actions";
import { PageHeader } from "@/components/page-header";
import type { Unit, UnitType } from "@/lib/types";

export function EditUnitForm({
  propertyId,
  unit,
  unitTypes,
  unitStatuses,
  error,
}: {
  propertyId: number;
  unit: Unit;
  unitTypes: UnitType[];
  unitStatuses: string[];
  error?: string;
}) {
  const [unitTypeId, setUnitTypeId] = useState(
    unitTypes.find((t) => t.name === unit.unitType)?.id ?? unitTypes[0]?.id ?? 0
  );
  const [status, setStatus] = useState(unit.status);
  const [label, setLabel] = useState(unit.label);
  const [bedrooms, setBedrooms] = useState(String(unit.bedrooms));
  const [bathrooms, setBathrooms] = useState(String(unit.bathrooms));
  const [squareFeet, setSquareFeet] = useState(String(unit.squareFeet));
  const [askingRent, setAskingRent] = useState(String(unit.askingRent));

  const inputClass =
    "rounded-lg border border-default px-3 py-2.5 text-sm text-heading placeholder:text-muted focus:outline-none focus:border-accent";
  const labelClass = "text-sm font-medium text-heading";

  return (
    <div>
      <PageHeader title="Edit unit" description="Update this unit's details." />

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
        <div className="bg-white rounded-2xl border border-default shadow-sm p-6">
          {error && (
            <p className="mb-4 rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">
              {error}
            </p>
          )}

          <form action={updateUnitAction} className="flex flex-col gap-4">
            <input type="hidden" name="propertyId" value={propertyId} />
            <input type="hidden" name="unitId" value={unit.id} />

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
              <label htmlFor="status" className={labelClass}>Status</label>
              <select
                id="status"
                name="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={inputClass}
              >
                {unitStatuses.map((s) => (
                  <option key={s} value={s}>{s}</option>
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
                required
                value={bedrooms}
                onChange={(e) => setBedrooms(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="bathrooms" className={labelClass}>Bathrooms</label>
                <input
                  id="bathrooms"
                  name="bathrooms"
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
                  required
                  value={squareFeet}
                  onChange={(e) => setSquareFeet(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="askingRent" className={labelClass}>Asking Rent</label>
                <input
                  id="askingRent"
                  name="askingRent"
                  required
                  value={askingRent}
                  onChange={(e) => setAskingRent(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="mt-2 pt-4 border-t border-default flex justify-end gap-3">
              <Link
                href={`/landlord/properties/${propertyId}/units/${unit.id}`}
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
      </div>
    </div>
  );
}
