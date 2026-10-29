"use client";

import { useState } from "react";
import { createTenantInviteAction } from "./actions";
import type { Property } from "@/lib/types";

// When tenancyId is given the invite is for a co-tenant joining that lease, so the unit is fixed to the lease's unit.
export function InviteTenantForm({
  properties,
  initialUnitId,
  tenancyId,
}: {
  properties: Property[];
  initialUnitId?: number;
  tenancyId?: number;
}) {
  const firstUnit = properties.flatMap((p) => p.units)[0];
  const [email, setEmail] = useState("");
  const [unitId, setUnitId] = useState(initialUnitId ?? firstUnit?.id ?? 0);

  const inputClass =
    "rounded-lg border border-default px-3 py-2.5 text-sm text-heading placeholder:text-muted focus:outline-none focus:border-accent";
  const labelClass = "text-sm font-medium text-heading";

  return (
    <div className="bg-white rounded-2xl border border-default shadow-sm p-6 max-w-2xl">
      <form action={createTenantInviteAction} className="flex flex-col gap-4">
        {tenancyId && (
          <>
            <input type="hidden" name="tenancyId" value={tenancyId} />
            <p className="rounded-lg bg-accent-tint px-3 py-2 text-xs text-accent-dark">
              This person will join the existing lease for this unit as a co-tenant.
            </p>
          </>
        )}
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
            disabled={Boolean(tenancyId)}
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

        {tenancyId && <input type="hidden" name="unitId" value={unitId} />}

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