"use client";

// The billing part of Settings for a landlord on a paid plan, in the order other products use: the plan card (drawn by the page), then
// Payment method and invoices, then Cancel subscription last. Cancelling opens the cancel popup (at the end of the period, or a full
// refund within the refund window); the receipt card appears above the plan card afterwards.
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { BillingCancelDialog } from "@/components/billing-cancel-dialog";
import { BillingReceipt } from "@/components/billing-receipt";
import { Icon } from "@/components/pricing/icons";
import { cardPageAction } from "@/lib/billing-actions";
import { dayText } from "@/lib/billing-format";
import { goToSessionExpired } from "@/lib/session-expired-client";
import type { Receipt } from "@/lib/billing-receipt";

interface Props {
  currentName: string;
  refundWindowDays: number;
  // The plan already ends at the end of the period, so there is nothing more to cancel.
  cancelAtPeriodEnd: boolean;
  // When the paid period ends (ISO date), for the cancel text; null if unknown.
  accessUntil: string | null;
  // The plan card, drawn by the page.
  children: ReactNode;
}

export function ManageSubscription({ currentName, refundWindowDays, cancelAtPeriodEnd, accessUntil, children }: Props) {
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

  const until = accessUntil ? dayText(accessUntil) : "the end of your billing period";

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

      {children}

      <section className="rounded-2xl border border-default bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <span className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-xl bg-accent-tint text-accent">
              <Icon name="cash" className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-[15px] font-bold text-heading">Payment method and invoices</h3>
              <p className="text-[13px] text-muted">Update your card, and see or download past invoices.</p>
            </div>
          </div>
          <button type="button" onClick={openCardPage} disabled={openingCard} className="rounded-xl border-[1.5px] border-default bg-white px-4 py-2.5 text-[13px] font-bold text-heading hover:border-accent hover:text-accent-dark disabled:opacity-60">
            {openingCard ? "Opening…" : "Manage card and invoices"}
          </button>
        </div>
        {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{error}</p>}
      </section>

      <section className="rounded-2xl border border-[#eadfdd] bg-white p-5 shadow-sm">
        <h3 className="text-[15px] font-bold text-heading">Cancel subscription</h3>
        {cancelAtPeriodEnd ? (
          <p className="mt-1 text-[13px] leading-relaxed text-muted">Your plan already ends on {until}. You can undo this from the notice at the top of this section.</p>
        ) : (
          <>
            <p className="mt-1 text-[13px] leading-relaxed text-muted">
              You keep {currentName} until {until}, then move to the free plan.
            </p>
            <p className="mt-3 flex items-start gap-2 text-[12.5px] leading-relaxed text-muted">
              <Icon name="history" className="mt-0.5 h-4 w-4 flex-none text-brand-green" />
              <span>Paid in the last {refundWindowDays} days? You can cancel now and have that payment refunded in full.</span>
            </p>
            <button type="button" onClick={() => setCancelling(true)} className="mt-4 rounded-xl border-[1.5px] border-[#f1c6c2] bg-white px-4 py-2.5 text-[13px] font-bold text-red-700 hover:bg-red-50">
              Cancel plan or refund
            </button>
          </>
        )}
      </section>

      {cancelling && <BillingCancelDialog currentName={currentName} onClose={() => setCancelling(false)} onDone={done} />}
    </div>
  );
}
