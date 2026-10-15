"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Modal } from "@/components/console/modal";
import { TwoFactorResetModal } from "@/components/console/two-factor-reset-modal";
import { ErrorBox, Pill, goToSessionExpired, primaryButtonClass, secondaryButtonClass } from "@/components/console/ui";
import { resetLandlordTwoFactorAction, setLandlordActiveAction } from "@/lib/staff-actions";

// The "Account" card on a landlord's detail page. SuperAdmin only (the page decides whether to show it).
//
// Two controls:
//   - Deactivate / Reactivate: switches the landlord's account off or on. A switched-off landlord is signed out
//     everywhere and cannot sign in. Nothing is deleted.
//   - Reset two-factor: for a landlord who lost their authenticator. They set it up again at their next sign-in.
export function LandlordAccount({
  landlordProfileId,
  userId,
  name,
  isActive,
}: {
  landlordProfileId: number;
  // Missing when the backend has not been updated to send it; the reset button is then hidden.
  userId?: string;
  name: string;
  // Missing when the backend has not been updated to send it; the on/off control is then hidden.
  isActive?: boolean;
}) {
  const router = useRouter();

  // Which popup is open, if any.
  const [dialog, setDialog] = useState<"deactivate" | "reset2fa" | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // A short confirmation after something worked.
  const [done, setDone] = useState("");

  // Switches the account on or off, then reloads the page so the status updates.
  async function setActive(active: boolean) {
    setBusy(true);
    setError("");
    const result = await setLandlordActiveAction(landlordProfileId, active);
    setBusy(false);

    if ("error" in result) {
      if (result.expired) return goToSessionExpired();
      setError(result.error);
      return;
    }
    setDialog(null);
    setDone(active ? "Account reactivated." : "Account deactivated. They were signed out everywhere.");
    router.refresh();
  }

  return (
    <section className="rounded-2xl border border-c-bd bg-c-sf p-6 animate-up" style={{ animationDelay: "0.09s" }}>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-medium">Account</h2>
        {isActive !== undefined && (
          <Pill className={isActive ? "bg-c-ok text-c-okt" : "bg-c-bad text-c-badt"}>
            {isActive ? "Active" : "Deactivated"}
          </Pill>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {isActive === true && (
          <button type="button" onClick={() => setDialog("deactivate")} className={secondaryButtonClass}>
            Deactivate account
          </button>
        )}
        {isActive === false && (
          <button type="button" onClick={() => setActive(true)} disabled={busy} className={primaryButtonClass}>
            {busy ? "Reactivating…" : "Reactivate account"}
          </button>
        )}
        {userId && (
          <button type="button" onClick={() => setDialog("reset2fa")} className={secondaryButtonClass}>
            Reset two-factor
          </button>
        )}
      </div>

      {done && <p className="mt-3 text-[13px] text-c-okt">{done}</p>}
      {dialog === null && error && (
        <div className="mt-3">
          <ErrorBox message={error} />
        </div>
      )}
      {isActive === undefined && !userId && (
        <p className="mt-3 text-xs text-c-tx3">
          Account controls become available once the backend update is deployed.
        </p>
      )}

      {/* Confirm before switching an account off, because it signs the person out right away. */}
      {dialog === "deactivate" && (
        <Modal title="Deactivate account" subtitle={name} busy={busy} onClose={() => setDialog(null)}>
          <div className="flex flex-col gap-4">
            <p className="text-[13px] text-c-tx2">
              {name} will be signed out on every device and won&apos;t be able to sign in. Their properties, tenants and
              data are kept. You can reactivate the account at any time. They get an email about it.
            </p>
            <ErrorBox message={error} />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setDialog(null)} disabled={busy} className={secondaryButtonClass}>
                Cancel
              </button>
              <button type="button" onClick={() => setActive(false)} disabled={busy} className={primaryButtonClass}>
                {busy ? "Deactivating…" : "Deactivate"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {dialog === "reset2fa" && userId && (
        <TwoFactorResetModal
          who={name}
          explanation="They are signed out everywhere and will set up their authenticator app again at their next sign-in. Their password does not change. They get an email about it."
          onSubmit={(reason, note, code) => resetLandlordTwoFactorAction(userId, reason, note, code)}
          onClose={() => setDialog(null)}
          onDone={() => {
            setDialog(null);
            setDone("Two-factor reset. They will set it up again at their next sign-in.");
          }}
        />
      )}
    </section>
  );
}
