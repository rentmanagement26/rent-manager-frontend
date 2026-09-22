"use client";

import { useState } from "react";
import { createTenantInviteAction } from "./actions";
import type { Property } from "@/lib/types";

export function InviteTenantForm({ properties }: { properties: Property[] }) {
  const firstUnit = properties.flatMap((p) => p.units)[0];
  const [email, setEmail] = useState("");
  const [unitId, setUnitId] = useState(firstUnit?.id ?? 0);

  const inputClass =
    "rounded-lg border border-default px-3 py-2.5 text-sm text-heading placeholder:text-muted focus:outline-none focus:border-accent";
  const labelClass = "text-sm font-medium text-heading";

  return (
    <div className="bg-white rounded-2xl border border-default shadow-sm p-6 max-w-2xl">
      <form action={createTenantInviteAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className={labelClass}>Tenant&apos;s email</label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="tenant@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="unitId" className={labelClass}>Unit</label>
          <select
            id="unitId"
            name="unitId"
            value={unitId}
            onChange={(e) => setUnitId(Number(e.target.value))}
            className={inputClass}
          >
            {properties.map((property) =>
              property.units.length > 0 ? (
                <optgroup key={property.id} label={property.name}>
                  {property.units.map((unit) => (
                    <option key={unit.id} value={unit.id}>{unit.label}</option>
                  ))}
                </optgroup>
              ) : null
            )}
          </select>
        </div>

        <div className="mt-2 pt-4 border-t border-default flex justify-end">
          <button
            type="submit"
            className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark"
          >
            Send invite
          </button>
        </div>
      </form>
    </div>
  );
}