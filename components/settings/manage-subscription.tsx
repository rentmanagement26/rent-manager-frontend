"use client";

// The "Manage subscription" box under Settings: update the card on file, or cancel the plan (at the end of the period, or for a full
// refund within the refund window). After a cancellation the same receipt card as on the Billing page appears here.
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BillingCancelDialog } from "@/components/billing-cancel-dialog";
import { BillingReceipt } from "@/components/billing-receipt";
import { cardPageAction } from "@/lib/billing-actions";
import { goToSessionExpired } from "@/lib/session-expired-client";
import type { Receipt } from "@/lib/billing-receipt";

interface Props {
  currentName: string;
  refundWindowDays: number;
  // The plan already ends at the end of the period, so there is nothing more to cancel.
  cancelAtPeriodEnd: boolean;
}

export function ManageSubscription({ currentName, refundWindowDays, cancelAtPeriodEnd }: Props) {
  const router = useRouter();
  const [cancelling, setCancelling] = useState(false);
  const [openingCard, setOpeningCard] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [error, setError] = useState("");

  async function openCardPage() {
    setError("");
    setOpeningCard(true);
    const result = await cardPageAction();
    if ("error" in result) {
      setOpeningCard(false);
      if (result.expired) return goToSessionExpired();
      setError(result.error);
      return;
    }
    window.location.assign(result.url);
  }

  // After a cancellation: close the popup, show the receipt and reload the page behind it.
  function done(next: Receipt) {
    setCancelling(false);
    setReceipt(next);
    router.refresh();
  }

  return (
    <div className="max-w-5xl space-y-4">
      {receipt && (
        <BillingReceipt
          receipt={receipt}
          onDismiss={() => setReceipt(null)}
          onActionDone={() => {
            setReceipt(null);
            router.refresh();
          }}
        />
      )}

      <section className="rounded-2xl border border-default bg-white p-5">
        <h3 className="text-base font-semibold text-heading">Manage subscription</h3>
        <p className="mt-1 text-sm text-muted">
          Update your card, see your invoices, or cancel. Cancel within {refundWindowDays} days of a payment and you can have that payment refunded in full.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" onClick={openCardPage} disabled={openingCard} className="rounded-xl border border-default px-4 py-2 text-sm font-semibold text-heading hover:border-accent hover:text-accent-dark disabled:opacity-60">
            {openingCard ? "Opening…" : "Update card"}
          </button>
          {!cancelAtPeriodEnd && (
            <button type="button" onClick={() => setCancelling(true)} className="rounded-xl border border-default px-4 py-2 text-sm font-semibold text-red-700 hover:border-red-300 hover:bg-red-50">
              Cancel plan or refund
            </button>
          )}
        </div>
        {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{error}</p>}
      </section>

      {cancelling && <BillingCancelDialog currentName={currentName} onClose={() => setCancelling(false)} onDone={done} />}
    </div>
  );
}
