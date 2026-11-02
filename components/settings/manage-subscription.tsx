"use client";

// The plan card and a single "Manage subscription" button under it (Settings, for a landlord on a paid plan). The button opens a small menu:
// Change plan, Update card, and Cancel plan or refund (at the end of the period, or a full refund within the refund window). After a
// cancellation the same receipt card as on the Billing page appears above the plan card.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { BillingCancelDialog } from "@/components/billing-cancel-dialog";
import { BillingReceipt } from "@/components/billing-receipt";
import { Icon } from "@/components/pricing/icons";
import { cardPageAction } from "@/lib/billing-actions";
import { goToSessionExpired } from "@/lib/session-expired-client";
import type { Receipt } from "@/lib/billing-receipt";

interface Props {
  currentName: string;
  refundWindowDays: number;
  // The plan already ends at the end of the period, so there is nothing more to cancel.
  cancelAtPeriodEnd: boolean;
  // The plan card, drawn by the page.
  children: ReactNode;
}

const menuItem = "flex w-full items-center px-4 py-2.5 text-left text-sm font-medium hover:bg-subtle disabled:opacity-60";

export function ManageSubscription({ currentName, refundWindowDays, cancelAtPeriodEnd, children }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [openingCard, setOpeningCard] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [error, setError] = useState("");
  const menu = useRef<HTMLDivElement>(null);

  // Closes the menu when the landlord clicks anywhere else.
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menu.current && !menu.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function openCardPage() {
    setError("");
    setOpeningCard(true);
    const result = await cardPageAction();
    if ("error" in result) {
      setOpeningCard(false);
      setOpen(false);
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
    <div className="space-y-4">
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

      <div className="relative inline-block" ref={menu}>
        <button
          type="button"
          aria-expanded={open}
          aria-haspopup="menu"
          onClick={() => setOpen((value) => !value)}
          className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark"
        >
          Manage subscription
          <Icon name="chevronDown" className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        {open && (
          <div role="menu" className="absolute left-0 z-20 mt-2 w-72 overflow-hidden rounded-xl border border-default bg-white py-1 shadow-lg">
            <Link href="/landlord/billing" role="menuitem" className={`${menuItem} text-heading`} onClick={() => setOpen(false)}>
              Change plan
            </Link>
            <button type="button" role="menuitem" onClick={openCardPage} disabled={openingCard} className={`${menuItem} text-heading`}>
              {openingCard ? "Opening…" : "Update card and invoices"}
            </button>
            {!cancelAtPeriodEnd && (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  setCancelling(true);
                }}
                className={`${menuItem} text-red-700 hover:bg-red-50`}
              >
                Cancel plan or refund
              </button>
            )}
            <p className="border-t border-default px-4 py-2.5 text-xs leading-relaxed text-muted">
              Cancel within {refundWindowDays} days of a payment and you can have that payment refunded in full.
            </p>
          </div>
        )}
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{error}</p>}
      {cancelling && <BillingCancelDialog currentName={currentName} onClose={() => setCancelling(false)} onDone={done} />}
    </div>
  );
}
