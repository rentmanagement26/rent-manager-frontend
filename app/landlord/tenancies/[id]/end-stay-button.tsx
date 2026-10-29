"use client";

// "End their stay" for a co-tenant: asks for the date they left, then confirms before sending.
import { useState } from "react";
import { endCoTenantAction } from "@/lib/tenancy-actions";

export function EndStayButton({ tenancyId, tenantProfileId, name }: { tenancyId: number; tenantProfileId: number; name: string }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-xs font-semibold text-accent hover:text-accent-dark">
        End their stay
      </button>
    );
  }

  return (
    <form action={endCoTenantAction} className="flex flex-wrap items-center gap-2 text-xs">
      <input type="hidden" name="tenancyId" value={tenancyId} />
      <input type="hidden" name="tenantProfileId" value={tenantProfileId} />
      <label className="text-muted" htmlFor={`left-${tenantProfileId}`}>
        {name} left on
      </label>
      <input
        id={`left-${tenantProfileId}`}
        name="leftOn"
        type="date"
        className="rounded-lg border border-default px-2 py-1 text-heading focus:border-accent focus:outline-none"
      />
      <button type="submit" className="rounded-lg bg-accent px-3 py-1.5 font-semibold text-white hover:bg-accent-dark">
        Confirm
      </button>
      <button type="button" onClick={() => setOpen(false)} className="text-muted hover:text-heading">
        Cancel
      </button>
    </form>
  );
}
