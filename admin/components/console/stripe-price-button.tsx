"use client";

// The "Stripe price" button on a paid plan's card and its popup: the Stripe price landlords pay for the plan.
// It shows the price saved now (read from the backend) and takes a new one. Replaces the old payment link popup.
import { useEffect, useState } from "react";
import { Modal } from "@/components/console/modal";
import { ErrorBox, goToSessionExpired, inputClass, primaryButtonClass, secondaryButtonClass } from "@/components/console/ui";
import { loadPackageBillingAction, setStripePriceAction } from "@/lib/price-actions";
import type { PackageBilling } from "@/lib/types";

function PriceModal({ packageId, planName, onClose }: { packageId: number; planName: string; onClose: () => void }) {
  const [current, setCurrent] = useState<PackageBilling | null>(null);
  const [priceId, setPriceId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  // Bumped after a save so the saved price is read again.
  const [reloadKey, setReloadKey] = useState(0);

  // Loads the saved price when the popup opens (most visits never look at it).
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
    const result = await setStripePriceAction({ packageId, priceId });
    setBusy(false);
    if ("error" in result) {
      if (result.expired) return goToSessionExpired();
      setError(result.error);
      return;
    }
    setSaved(true);
    setPriceId("");
    setReloadKey((n) => n + 1);
  }

  return (
    <Modal title="Stripe price" subtitle={planName} busy={busy} onClose={onClose}>
      <div className="space-y-3">
        <div className="rounded-xl bg-c-sf2 px-3 py-2.5 text-[13px]">
          <p className="text-c-tx3">Saved now</p>
          {current === null ? (
            <p className="text-c-tx2">Loading…</p>
          ) : current.stripePriceId ? (
            <p className="break-all font-mono">{current.stripePriceId}</p>
          ) : current.paymentLinkUrl ? (
            <p className="text-c-tx2">No price yet. This plan still uses an older payment link, which works until you save a price.</p>
          ) : (
            <p className="text-c-tx2">Nothing saved yet, so this plan can&apos;t be bought online.</p>
          )}
        </div>

        <p className="text-[13px] text-c-tx3">
          Paste the Stripe price landlords pay for this plan. Stripe checks it first: it must exist, be active, monthly and a fixed amount. Saving changes
          new checkouts only. Landlords already paying are not changed.
        </p>
        <label className="block text-[13px]">
          Stripe price id
          <input className={inputClass} value={priceId} onChange={(e) => setPriceId(e.target.value)} placeholder="price_..." />
        </label>
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
