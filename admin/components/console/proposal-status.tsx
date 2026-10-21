"use client";

// The "Awaiting customer" pill shown on a landlord while their plan proposal is unanswered, with a Withdraw link.
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pill, goToSessionExpired } from "@/components/console/ui";
import { formatWhen } from "@/lib/format";
import { withdrawProposalAction } from "@/lib/proposal-actions";

interface Props {
  changeId: number;
  // When the proposal runs out (null = no end), shown under the pill.
  expiresAt?: string | null;
  // False for roles that can't change plans: they see the pill but no Withdraw link.
  canWithdraw: boolean;
}

export function ProposalStatus({ changeId, expiresAt, canWithdraw }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function withdraw() {
    setBusy(true);
    setError("");
    const result = await withdrawProposalAction(changeId);
    setBusy(false);
    if ("error" in result) {
      if (result.expired) return goToSessionExpired();
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <div className="flex items-center gap-2">
        <Pill className="bg-c-pu text-c-put">Awaiting customer</Pill>
        {canWithdraw && (
          <button type="button" onClick={withdraw} disabled={busy} className="text-xs text-c-act2 hover:underline disabled:opacity-60">
            {busy ? "Withdrawing…" : "Withdraw"}
          </button>
        )}
      </div>
      {expiresAt && <span className="text-xs text-c-tx3">Until {formatWhen(expiresAt)}</span>}
      {error && <span className="text-xs text-c-badt">{error}</span>}
    </div>
  );
}
