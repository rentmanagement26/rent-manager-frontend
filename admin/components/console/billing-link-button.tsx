"use client";

// The "Billing link" button on a paid plan's card and its popup: where landlords go to pay for the plan in Stripe.
// The backend can't return the saved link, so the form always starts empty.
import { useState } from "react";
import { Modal } from "@/components/console/modal";
import { ErrorBox, goToSessionExpired, inputClass, primaryButtonClass, secondaryButtonClass } from "@/components/console/ui";
import { setBillingLinkAction } from "@/lib/package-actions";

export function BillingLinkButton({ packageId, planName }: { packageId: number; planName: string }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [linkId, setLinkId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function save() {
    setBusy(true);
    setError("");
    setSaved(false);
    const result = await setBillingLinkAction({ packageId, url, linkId });
    setBusy(false);
    if ("error" in result) {
      if (result.expired) return goToSessionExpired();
      setError(result.error);
      return;
    }
    setSaved(true);
  }

  function close() {
    setOpen(false);
    setUrl("");
    setLinkId("");
    setError("");
    setSaved(false);
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="self-start text-[13px] text-c-act2 hover:underline">
        Billing link
      </button>
      {open && (
        <Modal title="Billing link" subtitle={planName} busy={busy} onClose={close}>
          <div className="space-y-3">
            <p className="text-[13px] text-c-tx3">
              The Stripe Payment Link landlords are sent to for this plan. Saving replaces the current link. Both fields are required.
            </p>
            <label className="block text-[13px]">
              Payment link address
              <input className={inputClass} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://buy.stripe.com/..." />
            </label>
            <label className="block text-[13px]">
              Payment link id
              <input className={inputClass} value={linkId} onChange={(e) => setLinkId(e.target.value)} placeholder="plink_..." />
            </label>
            {error && <ErrorBox message={error} />}
            {saved && <p className="text-[13px] text-c-okt">Saved.</p>}
            <div className="flex gap-2">
              <button type="button" onClick={save} disabled={busy} className={primaryButtonClass}>
                {busy ? "Saving…" : "Save link"}
              </button>
              <button type="button" onClick={close} disabled={busy} className={secondaryButtonClass}>
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
