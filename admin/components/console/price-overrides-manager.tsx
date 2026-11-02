"use client";

// The "Custom price" card on the landlord page: a different monthly price for this landlord (a fixed amount or a percent off),
// with a popup to give one and a popup to remove one. Only one can be live at a time.
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Modal } from "@/components/console/modal";
import { Footer, useSubmit } from "@/components/console/overrides-manager";
import { Notice, Pill, cardClass, inputClass, primaryButtonClass, secondaryButtonClass } from "@/components/console/ui";
import { formatPrice, formatWhen } from "@/lib/format";
import { grantPriceOverrideAction, revokePriceOverrideAction } from "@/lib/price-actions";
import { PLAN_CHANGE_REASONS } from "@/lib/types";
import type { PriceOverride } from "@/lib/types";

// "50% off for 6 months" or "$15 a month for as long as they stay".
function describe(o: PriceOverride) {
  const what = o.kind === "percent_off" ? `${o.percentOff}% off` : `${formatPrice(o.monthlyAmount ?? 0)} a month`;
  const length = o.months ? `for ${o.months} month${o.months === 1 ? "" : "s"}` : "for as long as they stay";
  return `${what} ${length}`;
}

const STATUS: Record<PriceOverride["status"], { label: string; className: string }> = {
  in_use: { label: "In use", className: "bg-c-ok text-c-okt" },
  offered: { label: "Offered", className: "bg-c-aci text-c-act2" },
  revoked: { label: "Removed", className: "bg-c-sf2 text-c-tx3" },
};

// Popup to give a custom price.
function GrantModal({ landlordProfileId, landlordName, onClose, onSaved }: { landlordProfileId: number; landlordName: string; onClose: () => void; onSaved: () => void }) {
  const [kind, setKind] = useState("fixed_amount");
  const [value, setValue] = useState("");
  const [forever, setForever] = useState(true);
  const [months, setMonths] = useState("6");
  const [reasonCode, setReasonCode] = useState("");
  const [note, setNote] = useState("");
  const { submitting, error, run } = useSubmit(onSaved);

  const canSubmit = value.trim() !== "" && !!reasonCode && note.trim().length > 0 && (forever || months.trim() !== "");

  return (
    <Modal title="Give custom price" subtitle={landlordName} busy={submitting} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div className="flex gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <label htmlFor="price-kind" className="text-xs text-c-tx2">
              Kind
            </label>
            <select id="price-kind" value={kind} onChange={(e) => setKind(e.target.value)} className={inputClass}>
              <option value="fixed_amount">Fixed monthly amount</option>
              <option value="percent_off">Percent off</option>
            </select>
          </div>
          <div className="flex w-36 flex-col gap-2">
            <label htmlFor="price-value" className="text-xs text-c-tx2">
              {kind === "percent_off" ? "Percent off (1 to 100)" : "Amount per month"}
            </label>
            <input id="price-value" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} className={inputClass} />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="price-length" className="text-xs text-c-tx2">
            How long
          </label>
          <select id="price-length" value={forever ? "forever" : "months"} onChange={(e) => setForever(e.target.value === "forever")} className={inputClass}>
            <option value="forever">For as long as they stay</option>
            <option value="months">For a number of months</option>
          </select>
          {!forever && (
            <input aria-label="Months" inputMode="numeric" value={months} onChange={(e) => setMonths(e.target.value)} placeholder="Months (1 to 120)" className={inputClass} />
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="price-reason" className="text-xs text-c-tx2">
            Reason
          </label>
          <select id="price-reason" value={reasonCode} onChange={(e) => setReasonCode(e.target.value)} className={inputClass}>
            <option value="">Select a reason</option>
            {PLAN_CHANGE_REASONS.map((r) => (
              <option key={r.code} value={r.code}>
                {r.label}
              </option>
            ))}
          </select>
          <textarea
            aria-label="Note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="Short note for the audit log"
            className={`${inputClass} h-auto py-2.5`}
          />
        </div>

        <p className="text-[13px] text-c-tx3">
          The price applies at their next checkout. If they already pay, the price on their subscription changes now. They see it on their Billing page.
        </p>

        <Footer
          error={error}
          submitting={submitting}
          canSubmit={canSubmit}
          label="Save custom price"
          onClose={onClose}
          onSubmit={() =>
            run(() => grantPriceOverrideAction({ landlordProfileId, kind, value, months: forever ? "" : months, reasonCode, note }))
          }
        />
      </div>
    </Modal>
  );
}

// Popup to remove a custom price. A note is required.
function RemoveModal({ landlordProfileId, override, onClose, onSaved }: { landlordProfileId: number; override: PriceOverride; onClose: () => void; onSaved: () => void }) {
  const [note, setNote] = useState("");
  const { submitting, error, run } = useSubmit(onSaved);

  return (
    <Modal title="Remove custom price" subtitle={describe(override)} busy={submitting} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <p className="text-[13px] text-c-tx2">The landlord goes back to the plan&apos;s normal price.</p>
        <textarea
          aria-label="Note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="Why is it being removed? (kept in the audit log)"
          className={`${inputClass} h-auto py-2.5`}
        />
        <Footer
          error={error}
          submitting={submitting}
          canSubmit={note.trim().length > 0}
          label="Remove"
          onClose={onClose}
          onSubmit={() => run(() => revokePriceOverrideAction({ landlordProfileId, overrideId: override.id, note }))}
        />
      </div>
    </Modal>
  );
}

// The whole card. `canGrant` is true for staff with the price permission (they may give and remove prices).
export function PriceOverridesManager({
  landlordProfileId,
  landlordName,
  prices,
  canGrant,
}: {
  landlordProfileId: number;
  landlordName: string;
  prices: PriceOverride[];
  canGrant: boolean;
}) {
  const router = useRouter();
  const [granting, setGranting] = useState(false);
  const [removing, setRemoving] = useState<PriceOverride | null>(null);

  // The backend allows one live custom price at a time, so hide the button while one is live.
  const hasLive = prices.some((p) => p.status !== "revoked");

  function saved() {
    setGranting(false);
    setRemoving(null);
    router.refresh();
  }

  return (
    <section className={`${cardClass} animate-up`} style={{ animationDelay: "0.15s" }}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-medium">Custom price</h2>
          <p className="text-xs text-c-tx3">A different monthly price for this landlord. One at a time.</p>
        </div>
        {canGrant && !hasLive && (
          <button type="button" onClick={() => setGranting(true)} className={`${primaryButtonClass} flex items-center gap-1.5`}>
            <Plus size={16} /> Give custom price
          </button>
        )}
      </div>

      {prices.length === 0 ? (
        <Notice>No custom price. This landlord pays what their plan costs.</Notice>
      ) : (
        <ul className="flex flex-col divide-y divide-c-bd">
          {prices.map((p) => (
            <li key={p.id} className="flex flex-wrap items-start gap-x-3 gap-y-1 py-3 text-sm">
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 font-medium">
                  {describe(p)}
                  <Pill className={STATUS[p.status].className}>{STATUS[p.status].label}</Pill>
                </p>
                <p className="text-xs text-c-tx2">
                  Added {formatWhen(p.createdAt)}
                  {p.createdBy ? ` by ${p.createdBy}` : ""}
                </p>
                <p className="text-xs text-c-tx3">
                  {p.reasonCode}
                  {p.note ? ` — ${p.note}` : ""}
                </p>
                {p.status === "revoked" && (
                  <p className="text-xs text-c-tx3">
                    Removed{p.revokedBy ? ` by ${p.revokedBy}` : ""}
                    {p.revokedReason ? ` — ${p.revokedReason}` : ""}
                  </p>
                )}
              </div>
              {canGrant && p.status !== "revoked" && (
                <button type="button" onClick={() => setRemoving(p)} className={`${secondaryButtonClass} h-9`}>
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {granting && <GrantModal landlordProfileId={landlordProfileId} landlordName={landlordName} onClose={() => setGranting(false)} onSaved={saved} />}
      {removing && <RemoveModal landlordProfileId={landlordProfileId} override={removing} onClose={() => setRemoving(null)} onSaved={saved} />}
    </section>
  );
}
