"use client";

import { useState } from "react";
import { archivePropertyAction } from "../actions";

export function ArchivePropertyButton({
  propertyId,
  hasActiveUnits,
}: {
  propertyId: number;
  hasActiveUnits: boolean;
}) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 whitespace-nowrap"
      >
        Archive
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2">
      <p className="text-sm text-red-700 whitespace-nowrap">
        {hasActiveUnits ? "Will be blocked — active units exist." : "Archive this property?"}
      </p>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="rounded-lg border border-default bg-white px-3 py-1.5 text-xs font-semibold text-heading hover:bg-subtle"
      >
        Cancel
      </button>
      <form action={archivePropertyAction}>
        <input type="hidden" name="propertyId" value={propertyId} />
        <button
          type="submit"
          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 whitespace-nowrap"
        >
          Yes, archive
        </button>
      </form>
    </div>
  );
}
