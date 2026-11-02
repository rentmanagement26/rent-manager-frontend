"use client";

// The "Stripe price" button on a paid plan's card and its popup: the monthly and yearly Stripe prices landlords pay for the plan.
// It shows what is saved now (read from the backend) and takes new ones. An empty box leaves that price as it is.
import { useEffect, useState } from "react";
import { Modal } from "@/components/console/modal";
import { ErrorBox, goToSessionExpired, inputClass, primaryButtonClass, secondaryButtonClass } from "@/components/console/ui";
import { loadPackageBillingAction, setStripePriceAction } from "@/lib/price-actions";
import type { PackageBilling } from "@/lib/types";

function PriceModal({ packageId, planName, onClose }: { packageId: number; planName: string; onClose: () => void }) {
  const [current, setCurrent] = useState<PackageBilling | null>(null);
  const [priceId, setPriceId] = useState("");
  const [yearlyId, setYearlyId] = useState("");
  const [removeYearly, setRemoveYearly] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  // Bumped after a save so the saved prices are read again.
  const [reloadKey, setReloadKey] = useState(0);

  // Loads the saved prices when the popup opens (most visits never look at them).
  useEffect(() => {
    let cancelled = false;
    loadPackageBillingAction(packageId).then((answer) => {
      if (cancelled) return;
      if ("error" in answer) {
        if (answer.expired) return goToSessionExpired();
        setError(answer.error);
        return;
      }
      setCurrent(answer.data);
    });
    return () => {
      cancelled = true;
    };
  }, [packageId, reloadKey]);

  async function save() {
    setBusy(true);
    setError("");
    setSaved(false);
    const result = await setStripePriceAction({ packageId, priceId, yearlyPriceId: yearlyId, removeYearly });
    setBusy(false);
    if ("error" in result) {
      if (result.expired) return goToSessionExpired();
      setError(result.error);
      return;
    }
    setSaved(true);
    setPriceId("");
    setYearlyId("");
    setRemoveYearly(false);
    setReloadKey((n) => n + 1);
  }

  return (
    <Modal title="Stripe price" subtitle={planName} busy={busy} onClose={onClose}>
      <div className="space-y-3">
        <div className="space-y-1 rounded-xl bg-c-sf2 px-3 py-2.5 text-[13px]">
          <p className="text-c-tx3">Saved now</p>
          {current === null ? (
            <p className="text-c-tx2">Loading…</p>
          ) : (
            <>
              <p>
                <span className="text-c-tx2">Monthly </span>
                {current.stripePriceId ? <span className="break-all font-mono">{current.stripePriceId}</span> : <span className="text-c-tx3">not set</span>}
              </p>
              <p>
                <span className="text-c-tx2">Yearly </span>
                {current.stripeYearlyPriceId ? <span className="break-all font-mono">{current.stripeYearlyPriceId}</span> : <span className="text-c-tx3">not set</span>}
              </p>
              {!current.stripePriceId && current.paymentLinkUrl && (
                <p className="text-c-tx2">No monthly price yet. This plan still uses an older payment link, which works until you save a price.</p>
              )}
            </>
          )}
        </div>

        <p className="text-[13px] text-c-tx3">
          Paste the Stripe prices landlords pay for this plan. Stripe checks each one first: it must exist, be active and be a fixed amount with the right interval. Saving
          changes new checkouts only. Landlords already paying are not changed.
        </p>
        <label className="block text-[13px]">
          Monthly price id
          <input className={inputClass} value={priceId} onChange={(e) => setPriceId(e.target.value)} placeholder="price_..." />
        </label>
        <label className="block text-[13px]">
          Yearly price id
          <input className={inputClass} value={yearlyId} onChange={(e) => setYearlyId(e.target.value)} placeholder="price_..." disabled={removeYearly} />
        </label>
        {current?.stripeYearlyPriceId && (
          <label className="flex items-center gap-2 text-[13px] text-c-tx2">
            <input type="checkbox" checked={removeYearly} onChange={(e) => setRemoveYearly(e.target.checked)} />
            Remove yearly billing for this plan
          </label>
        )}
        {error && <ErrorBox message={error} />}
        {saved && <p className="text-[13px] text-c-okt">Saved.</p>}
        <div className="flex gap-2">
          <button type="button" onClick={save} disabled={busy} className={primaryButtonClass}>
            {busy ? "Saving…" : "Save price"}
          </button>
          <button type="button" onClick={onClose} disabled={busy} className={secondaryButtonClass}>
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function StripePriceButton({ packageId, planName }: { packageId: number; planName: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="self-start text-[13px] text-c-act2 hover:underline">
        Stripe price
      </button>
      {open && <PriceModal packageId={packageId} planName={planName} onClose={() => setOpen(false)} />}
    </>
  );
}
