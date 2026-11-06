"use client";

// The buttons at the end of a contractor's row: Edit, Invite to DomusPRO (or Resend invitation), and Make inactive / Reactivate.
import Link from "next/link";
import { useState } from "react";
import { useRunner } from "@/components/maintenance-request-actions";
import { inviteContractorAction, setContractorActiveAction } from "@/lib/contractor-actions";
import type { ContractorListItem } from "@/lib/contractor-types";

const smallButton = "rounded-full border border-default bg-white px-3 py-1.5 text-xs font-semibold text-heading hover:bg-subtle disabled:cursor-not-allowed disabled:opacity-50";

export function ContractorRowActions({ contractor }: { contractor: ContractorListItem }) {
  const { busy, error, run } = useRunner();
  const [invited, setInvited] = useState(false);

  async function invite() {
    if (await run(() => inviteContractorAction(contractor.id))) setInvited(true);
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex flex-wrap justify-end gap-1.5">
        <Link href={`/landlord/maintenance/contractors/${contractor.id}`} className={smallButton}>Edit</Link>
        {contractor.canInvite && (
          <button type="button" disabled={busy} onClick={invite} className={smallButton}>
            {contractor.invitation ? "Resend invitation" : "Invite to DomusPRO"}
          </button>
        )}
        <button type="button" disabled={busy} onClick={() => run(() => setContractorActiveAction(contractor.id, !contractor.isActive))} className={smallButton}>
          {contractor.isActive ? "Make inactive" : "Reactivate"}
        </button>
      </div>
      {invited && <p role="status" className="text-xs font-medium text-green-800">Invitation sent.</p>}
      {error && <p role="alert" className="max-w-xs text-right text-xs font-medium text-red-700">{error}</p>}
    </div>
  );
}
