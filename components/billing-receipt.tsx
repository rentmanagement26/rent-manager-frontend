"use client";

// The receipt card on the Billing page after a plan change or a cancellation (see lib/billing-receipt.ts for the content). It stays
// until the landlord presses Done or the X. Some receipts have one extra button: keep the current plan, or undo a cancellation.
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/pricing/icons";
import { dropPendingChangeAction, undoCancelAction } from "@/lib/billing-actions";
import { goToSessionExpired } from "@/lib/session-expired-client";
import type { Receipt } from "@/lib/billing-receipt";

interface Props {
  receipt: Receipt;
  // Closes the receipt.
  onDismiss: () => void;
  // Called after the extra button worked (so the page behind the receipt reloads).
  onActionDone: () => void;
}

const BADGE: Record<Receipt["tone"], { circle: string; icon: "check" | "calendar" | "history" }> = {
  success: { circle: "bg-brand-green-tint text-brand-green", icon: "check" },
  notice: { circle: "bg-amber-100 text-amber-700", icon: "calendar" },
  refund: { circle: "bg-accent-tint text-accent", icon: "history" },
};

export function BillingReceipt({ receipt, onDismiss, onActionDone }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const card = useRef<HTMLDivElement>(null);

  // Brings the receipt into view when it appears, since it can be above where the landlord pressed the button.
  useEffect(() => {
    card.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  async function runAction() {
    if (!receipt.action) return;
    setBusy(true);
    setError("");
    const result = await (receipt.action.kind === "keepPlan" ? dropPendingChangeAction() : undoCancelAction());
    setBusy(false);
    if ("error" in result) return result.expired ? goToSessionExpired() : setError(result.error);
    onActionDone();
  }

  const badge = BADGE[receipt.tone];
  const noteStyle = receipt.note.tone === "success" ? "bg-[#eaf7f3] text-brand-green-dark" : "bg-amber-50 text-amber-900";

  return (
    <div ref={card} className="max-w-2xl overflow-hidden rounded-[22px] border border-subtle bg-white shadow-[0_14px_34px_-18px_rgba(22,48,43,0.3)]">
      <div className="flex items-start gap-3.5 px-5 pb-4 pt-5">
        <span className={`flex h-11 w-11 flex-none items-center justify-center rounded-full ${badge.circle}`}>
          <Icon name={badge.icon} className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h3 className="font-head text-xl font-extrabold leading-tight text-heading">{receipt.title}</h3>
          <p className="mt-1 text-[13.5px] leading-relaxed text-body">{receipt.lead}</p>
        </div>
        <button type="button" onClick={onDismiss} aria-label="Dismiss" className="ml-auto flex h-[30px] w-[30px] flex-none items-center justify-center rounded-full bg-bg text-lg leading-none text-muted hover:text-heading">
          &times;
        </button>
      </div>

      <div className="mx-5 overflow-hidden rounded-2xl border border-[#eef0f4]">
        {receipt.rows.map((row, index) => (
          <div key={row.label} className={`flex justify-between gap-4 px-4 py-3 text-[13.5px] ${index > 0 ? "border-t border-[#eef0f4]" : ""} ${row.tone === "total" ? "bg-[#fdf6f0]" : ""}`}>
            <span className={row.tone === "total" ? "font-bold text-heading" : "text-muted"}>{row.label}</span>
            <span className={`text-right ${row.tone === "total" ? "text-base font-extrabold text-accent-dark" : row.tone === "credit" ? "font-bold text-brand-green" : "font-bold text-heading"}`}>{row.value}</span>
          </div>
        ))}
      </div>

      <div className="space-y-3 px-5 pt-4">
        <p className={`rounded-[14px] px-3.5 py-3 text-[13px] leading-snug ${noteStyle}`}>{receipt.note.text}</p>
        {receipt.refundNote && <p className="text-[12.5px] leading-relaxed text-muted">{receipt.refundNote}</p>}
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{error}</p>}
      </div>

      <div className="flex flex-wrap items-center gap-3 px-5 pb-5 pt-5">
        {receipt.action && (
          <button type="button" onClick={runAction} disabled={busy} className="rounded-xl bg-accent px-4 py-2.5 text-[13px] font-bold text-white shadow-[0_8px_18px_-10px_rgba(217,96,31,0.8)] hover:bg-accent-dark disabled:opacity-60">
            {busy ? "Working…" : receipt.action.label}
          </button>
        )}
        <button
          type="button"
          onClick={onDismiss}
          disabled={busy}
          className={`rounded-xl px-4 py-2.5 text-[13px] font-bold ${receipt.action ? "border-[1.5px] border-default bg-white text-heading hover:border-accent" : "bg-accent text-white shadow-[0_8px_18px_-10px_rgba(217,96,31,0.8)] hover:bg-accent-dark"}`}
        >
          Done
        </button>
      </div>
    </div>
  );
}
