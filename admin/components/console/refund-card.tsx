"use client";

// The "Refund" card on the landlord page: shows the landlord's last Stripe payment and, for staff with the refund permission,
// a popup to refund it (all or part, optionally ending their plan). Every refund is audited and the landlord is emailed.
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Modal } from "@/components/console/modal";
import { Footer, useSubmit } from "@/components/console/overrides-manager";
import { Notice, cardClass, inputClass, primaryButtonClass } from "@/components/console/ui";
import { formatPrice, formatWhen } from "@/lib/format";
import { refundPaymentAction } from "@/lib/price-actions";
import type { LastPayment } from "@/lib/types";

// Popup to refund the last payment. The note is required and goes in the audit log.
function RefundModal({ landlordProfileId, landlordName, payment, onClose, onSaved }: { landlordProfileId: number; landlordName: string; payment: LastPayment; onClose: () => void; onSaved: () => void }) {
  const [amount, setAmount] = useState("");
  const [cancelPlan, setCancelPlan] = useState(false);
  const [note, setNote] = useState("");
  const { submitting, error, run } = useSubmit(onSaved);

  return (
    <Modal title="Refund payment" subtitle={landlordName} busy={submitting} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <p className="text-[13px] text-c-tx2">
          Last payment: {formatPrice(payment.amount)} {payment.currency?.toUpperCase() ?? ""}
          {payment.paidAt ? ` on ${formatWhen(payment.paidAt)}` : ""}. There is no 7-day limit for staff.
        </p>

        <div className="flex flex-col gap-2">
          <label htmlFor="refund-amount" className="text-xs text-c-tx2">
            Amount (leave empty to refund the whole payment)
          </label>
          <input id="refund-amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={payment.amount.toFixed(2)} className={inputClass} />
        </div>

        <label className="flex items-center gap-2 text-[13px] text-c-tx2">
          <input type="checkbox" checked={cancelPlan} onChange={(e) => setCancelPlan(e.target.checked)} />
          Also cancel their plan and move them to the free plan
        </label>

        <textarea
          aria-label="Note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="Why is it being refunded? (kept in the audit log)"
          className={`${inputClass} h-auto py-2.5`}
        />

        <p className="text-[13px] text-c-tx3">The landlord gets the email &ldquo;Your DomusPRO refund is on its way&rdquo;.</p>

        <Footer
          error={error}
          submitting={submitting}
          canSubmit={note.trim().length > 0}
          label="Refund"
          onClose={onClose}
          onSubmit={() => run(() => refundPaymentAction({ landlordProfileId, amount, cancelPlan, note }))}
        />
      </div>
    </Modal>
  );
}

// The whole card. `canRefund` is true for staff with billing.refund.
export function RefundCard({ landlordProfileId, landlordName, payment, canRefund }: { landlordProfileId: number; landlordName: string; payment: LastPayment; canRefund: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <section className={`${cardClass} animate-up`} style={{ animationDelay: "0.17s" }}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-medium">Refund</h2>
          <p className="text-xs text-c-tx3">The landlord&apos;s most recent Stripe payment.</p>
        </div>
        {canRefund && payment.hasPayment && (
          <button type="button" onClick={() => setOpen(true)} className={primaryButtonClass}>
            Issue refund
          </button>
        )}
      </div>

      <div className="mt-3">
        {payment.hasPayment ? (
          <p className="text-sm">
            <span className="font-medium">{formatPrice(payment.amount)}</span> {payment.currency?.toUpperCase()}
            <span className="text-c-tx2">{payment.paidAt ? ` · paid ${formatWhen(payment.paidAt)}` : ""}</span>
          </p>
        ) : (
          <Notice>This landlord has no Stripe payment to refund.</Notice>
        )}
      </div>

      {open && (
        <RefundModal
          landlordProfileId={landlordProfileId}
          landlordName={landlordName}
          payment={payment}
          onClose={() => setOpen(false)}
          onSaved={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      )}
    </section>
  );
}
