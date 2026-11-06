"use client";

// The "Request quotes" popup: ask 1 to 5 contractors to quote the work. Quote amounts are private: tenants and the other contractors never see them.
// A contractor is only asked once at a time; email-link and phone-only contractors are answered from the request page.
import { useState } from "react";
import { BillingDialog, ghostButton, primaryButton } from "@/components/billing-dialog";
import { ContractorPicker } from "@/components/contractor-picker";
import { useRunner } from "@/components/maintenance-request-actions";
import { requestQuotesAction } from "@/lib/contractor-actions";
import type { ContractorListItem } from "@/lib/contractor-types";

const MAX_QUOTES = 5;

export function RequestQuotesDialog({ requestId, category, subtitle, onClose }: { requestId: number; category: string; subtitle: string; onClose: () => void }) {
  const [chosen, setChosen] = useState<number[]>([]);
  const [note, setNote] = useState("");
  const { busy, error, run } = useRunner();

  // Picks or drops one contractor, up to five.
  function toggle(contractor: ContractorListItem) {
    setChosen((current) => (current.includes(contractor.id) ? current.filter((id) => id !== contractor.id) : current.length < MAX_QUOTES ? [...current, contractor.id] : current));
  }

  async function send() {
    if (await run(() => requestQuotesAction(requestId, chosen, note))) onClose();
  }

  return (
    <BillingDialog title="Request quotes" subtitle={subtitle}>
      <p className="mb-3 text-sm text-body">
        Choose 1 to {MAX_QUOTES}. <span className="font-semibold text-heading">{chosen.length} chosen</span>
      </p>
      <ContractorPicker category={category} selected={chosen} multiple onToggle={toggle} />

      <label htmlFor="quote-note" className="mb-1.5 mt-4 block text-sm font-semibold text-heading">
        Note for the contractors <span className="font-normal text-muted">(optional, up to 500 characters)</span>
      </label>
      <textarea
        id="quote-note"
        rows={3}
        maxLength={500}
        value={note}
        onChange={(event) => setNote(event.target.value)}
        className="w-full rounded-lg border border-default px-3 py-2.5 text-sm text-heading focus:border-accent focus:outline-none"
      />
      <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-xs text-green-800">
        Quote amounts are private. Contractors see the address, the problem, the photos and the access details, not the tenant&apos;s phone. Email-link and phone-only
        contractors do not answer in the app: you enter their quote or their &quot;no&quot; yourself.
      </p>

      {error && <p role="alert" className="mt-3 text-sm font-medium text-red-700">{error}</p>}
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={onClose} disabled={busy} className={ghostButton}>Cancel</button>
        <button type="button" onClick={send} disabled={busy || chosen.length === 0} className={primaryButton}>
          {busy ? "Sending…" : chosen.length > 0 ? `Send to ${chosen.length} contractor${chosen.length === 1 ? "" : "s"}` : "Send"}
        </button>
      </div>
    </BillingDialog>
  );
}
