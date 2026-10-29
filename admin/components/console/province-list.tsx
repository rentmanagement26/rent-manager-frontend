"use client";

// The province list on the Documents page: one row per province with an online-signing switch.
// Flipping a switch opens a popup for an optional note, and nothing is saved until it is confirmed.
import { useState } from "react";
import { Modal } from "@/components/console/modal";
import { ErrorBox, cardClass, goToSessionExpired, inputClass, primaryButtonClass, secondaryButtonClass } from "@/components/console/ui";
import { setProvinceAction } from "@/lib/document-actions";
import type { ProvinceSetting } from "@/lib/document-api";
import { formatWhen } from "@/lib/format";

export function ProvinceList({ initial, canManage }: { initial: ProvinceSetting[]; canManage: boolean }) {
  const [provinces, setProvinces] = useState(initial);
  // The province being switched and the value it would get, while the popup is open.
  const [pending, setPending] = useState<{ province: ProvinceSetting; enable: boolean } | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function ask(province: ProvinceSetting) {
    setPending({ province, enable: !province.onlineSigningEnabled });
    setNote(province.note ?? "");
    setError("");
  }

  async function confirm() {
    if (!pending) return;
    setBusy(true);
    setError("");
    const result = await setProvinceAction(pending.province.code, pending.enable, note);
    setBusy(false);

    if ("error" in result) {
      if (result.expired) return goToSessionExpired();
      setError(result.error);
      return;
    }
    setProvinces((list) => list.map((p) => (p.code === result.setting.code ? result.setting : p)));
    setPending(null);
  }

  return (
    <section className={`${cardClass} animate-up`}>
      <ul className="flex flex-col">
        {provinces.map((province) => (
          <li
            key={province.code}
            className="grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-3 border-t border-c-bd py-3.5 first:border-t-0 first:pt-0 sm:grid-cols-[2.5rem_minmax(0,1.2fr)_minmax(0,1.6fr)_minmax(0,1fr)_auto]"
          >
            <span className="font-medium">{province.code}</span>
            <span className="min-w-0 truncate">{province.name}</span>
            <span className="hidden min-w-0 truncate text-xs text-c-tx2 sm:block">{province.note ?? "No note"}</span>
            <span className="hidden text-xs text-c-tx3 sm:block">
              {province.updatedAt ? `${formatWhen(province.updatedAt)}${province.updatedBy ? ` · ${province.updatedBy}` : ""}` : "Never changed"}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={province.onlineSigningEnabled}
              aria-label={`Online signing in ${province.name}`}
              disabled={!canManage}
              onClick={() => ask(province)}
              className={`relative h-5 w-9 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                province.onlineSigningEnabled ? "bg-c-ac" : "bg-c-bd2"
              }`}
            >
              <span
                className={`absolute left-0.5 top-0.5 size-4 rounded-full bg-white transition-transform ${
                  province.onlineSigningEnabled ? "translate-x-4" : ""
                }`}
              />
            </button>
          </li>
        ))}
      </ul>

      {pending && (
        <Modal
          title={`${pending.enable ? "Switch on" : "Switch off"} online signing for ${pending.province.name}?`}
          subtitle={
            pending.enable
              ? "Landlords on a plan with online signing can then sign leases online here."
              : "This stops online signing here at once, also for documents already sent. Paper signing is not affected."
          }
          busy={busy}
          onClose={() => setPending(null)}
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="province-note" className="text-[13px] text-c-tx2">
                Note (optional)
              </label>
              <textarea
                id="province-note"
                rows={3}
                maxLength={500}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                className={`${inputClass} h-auto py-2.5`}
              />
            </div>
            <ErrorBox message={error} />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setPending(null)} disabled={busy} className={secondaryButtonClass}>
                Cancel
              </button>
              <button type="button" onClick={confirm} disabled={busy} className={primaryButtonClass}>
                {busy ? "Saving…" : pending.enable ? "Switch on" : "Switch off"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
}
