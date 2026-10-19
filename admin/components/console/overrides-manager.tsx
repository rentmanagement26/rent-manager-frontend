"use client";

// The "Overrides" card on the landlord page: lists extra allowances and feature switches given to this landlord,
// with popups to add one or remove one early.

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Modal } from "@/components/console/modal";
import { ErrorBox, Notice, Pill, cardClass, goToSessionExpired, inputClass, primaryButtonClass, secondaryButtonClass } from "@/components/console/ui";
import { formatWhen } from "@/lib/format";
import { grantFeatureOverrideAction, grantLimitOverrideAction, revokeOverrideAction } from "@/lib/override-actions";
import { PLAN_CHANGE_REASONS } from "@/lib/types";
import type { ActionFailure, Catalog, LandlordOverride } from "@/lib/types";

type Result = { ok: true } | ActionFailure;

// Runs a save, then reports success to the parent or shows the failure. Sends an expired session to sign-in.
function useSubmit(onDone: () => void) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function run(save: () => Promise<Result>) {
    setSubmitting(true);
    setError("");
    const result = await save();
    setSubmitting(false);
    if ("error" in result) {
      if (result.expired) return goToSessionExpired();
      setError(result.error);
      return;
    }
    onDone();
  }

  return { submitting, error, run };
}

// Cancel / Save buttons with the error message above them.
function Footer({
  error,
  submitting,
  canSubmit,
  label,
  onClose,
  onSubmit,
}: {
  error: string;
  submitting: boolean;
  canSubmit: boolean;
  label: string;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <>
      <ErrorBox message={error} />
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} disabled={submitting} className={secondaryButtonClass}>
          Cancel
        </button>
        <button type="button" onClick={onSubmit} disabled={!canSubmit || submitting} className={primaryButtonClass}>
          {submitting ? "Saving…" : label}
        </button>
      </div>
    </>
  );
}

// What the admin is adding: extra amount of a limit, switching a feature on, or switching one off.
type Mode = "limit" | "grant" | "remove";

// Popup for a new override.
function AddOverrideModal({
  landlordProfileId,
  landlordName,
  catalog,
  onClose,
  onSaved,
}: {
  landlordProfileId: number;
  landlordName: string;
  catalog: Catalog;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [mode, setMode] = useState<Mode>("limit");
  const [limitKey, setLimitKey] = useState(catalog.limits[0]?.key ?? "");
  const [featureKey, setFeatureKey] = useState(catalog.features[0]?.key ?? "");
  const [amount, setAmount] = useState("1");
  const [endDate, setEndDate] = useState("");
  const [reasonCode, setReasonCode] = useState("");
  const [note, setNote] = useState("");
  const { submitting, error, run } = useSubmit(onSaved);

  const isLimit = mode === "limit";
  const hasTarget = isLimit ? !!limitKey && amount.trim() !== "" : !!featureKey;
  const canSubmit = hasTarget && !!reasonCode && note.trim().length > 0;

  function submit() {
    const common = { landlordProfileId, reasonCode, note, endDate };
    return run(() =>
      isLimit
        ? grantLimitOverrideAction({ ...common, limitKey, additionalValue: Number(amount) })
        : grantFeatureOverrideAction({ ...common, featureKey, grant: mode === "grant" }),
    );
  }

  return (
    <Modal title="Add override" subtitle={landlordName} busy={submitting} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="override-mode" className="text-xs text-c-tx2">
            What to change
          </label>
          <select id="override-mode" value={mode} onChange={(e) => setMode(e.target.value as Mode)} className={inputClass}>
            <option value="limit">Give extra of a limit</option>
            <option value="grant">Switch a feature on</option>
            <option value="remove">Switch a feature off</option>
          </select>
        </div>

        {isLimit ? (
          <div className="flex gap-3">
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <label htmlFor="override-limit" className="text-xs text-c-tx2">
                Limit
              </label>
              <select id="override-limit" value={limitKey} onChange={(e) => setLimitKey(e.target.value)} className={inputClass}>
                {catalog.limits.map((l) => (
                  <option key={l.key} value={l.key}>
                    {l.displayName}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex w-24 flex-col gap-2">
              <label htmlFor="override-amount" className="text-xs text-c-tx2">
                Extra
              </label>
              <input id="override-amount" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputClass} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <label htmlFor="override-feature" className="text-xs text-c-tx2">
              Feature
            </label>
            <select id="override-feature" value={featureKey} onChange={(e) => setFeatureKey(e.target.value)} className={inputClass}>
              {catalog.features.map((f) => (
                <option key={f.key} value={f.key}>
                  {f.displayName}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label htmlFor="override-end" className="text-xs text-c-tx2">
            Ends on (optional, leave empty for no end)
          </label>
          <input id="override-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputClass} />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="override-reason" className="text-xs text-c-tx2">
            Reason
          </label>
          <select id="override-reason" value={reasonCode} onChange={(e) => setReasonCode(e.target.value)} className={inputClass}>
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

        <Footer error={error} submitting={submitting} canSubmit={canSubmit} label="Add override" onClose={onClose} onSubmit={submit} />
      </div>
    </Modal>
  );
}

// Popup to end an override early. A note is required.
function RevokeModal({
  landlordProfileId,
  override,
  onClose,
  onSaved,
}: {
  landlordProfileId: number;
  override: LandlordOverride;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [note, setNote] = useState("");
  const { submitting, error, run } = useSubmit(onSaved);

  return (
    <Modal title="Remove override" subtitle={`${override.displayName} · ${override.effect}`} busy={submitting} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <p className="text-[13px] text-c-tx2">The landlord goes back to what their plan gives them for this item.</p>
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
          onSubmit={() =>
            run(() => revokeOverrideAction({ landlordProfileId, kind: override.kind, overrideId: override.id, note }))
          }
        />
      </div>
    </Modal>
  );
}

const STATUS_STYLE: Record<LandlordOverride["status"], string> = {
  Active: "bg-c-ok text-c-okt",
  Scheduled: "bg-c-aci text-c-act2",
  Expired: "bg-c-sf2 text-c-tx3",
  Revoked: "bg-c-sf2 text-c-tx3",
};

// One line describing the override, like "Properties +2" or "Online payments (granted)".
function describe(o: LandlordOverride) {
  return o.kind === "limit" ? `${o.displayName} ${o.effect}` : `${o.displayName} (${o.effect})`;
}

// The whole card. `catalog` is null when the admin can only look (no add/remove buttons then).
export function OverridesManager({
  landlordProfileId,
  landlordName,
  overrides,
  catalog,
}: {
  landlordProfileId: number;
  landlordName: string;
  overrides: LandlordOverride[];
  catalog: Catalog | null;
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [revoking, setRevoking] = useState<LandlordOverride | null>(null);

  function saved() {
    setAdding(false);
    setRevoking(null);
    router.refresh();
  }

  return (
    <section className={`${cardClass} animate-up`} style={{ animationDelay: "0.12s" }}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-medium">Overrides</h2>
        {catalog && (
          <button type="button" onClick={() => setAdding(true)} className={`${primaryButtonClass} flex items-center gap-1.5`}>
            <Plus size={16} /> Add override
          </button>
        )}
      </div>

      {overrides.length === 0 ? (
        <Notice>No overrides. This landlord gets exactly what their plan includes.</Notice>
      ) : (
        <ul className="flex flex-col divide-y divide-c-bd">
          {overrides.map((o) => {
            // Only Active or Scheduled overrides can still be removed.
            const removable = catalog && (o.status === "Active" || o.status === "Scheduled");
            return (
              <li key={`${o.kind}-${o.id}`} className="flex flex-wrap items-start gap-x-3 gap-y-1 py-3 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-medium">
                    {describe(o)}
                    <Pill className={STATUS_STYLE[o.status]}>{o.status}</Pill>
                  </p>
                  <p className="text-xs text-c-tx2">
                    {o.expiresAt ? `Until ${formatWhen(o.expiresAt)}` : "No end date"}
                    {o.createdBy ? ` · added by ${o.createdBy}` : ""}
                  </p>
                  {(o.reasonCode || o.note) && (
                    <p className="text-xs text-c-tx3">
                      {o.reasonCode}
                      {o.reasonCode && o.note ? " — " : ""}
                      {o.note}
                    </p>
                  )}
                  {o.status === "Revoked" && (
                    <p className="text-xs text-c-tx3">
                      Removed{o.revokedBy ? ` by ${o.revokedBy}` : ""}
                      {o.revokedReason ? ` — ${o.revokedReason}` : ""}
                    </p>
                  )}
                </div>
                {removable && (
                  <button type="button" onClick={() => setRevoking(o)} className={`${secondaryButtonClass} h-9`}>
                    Remove
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {adding && catalog && (
        <AddOverrideModal
          landlordProfileId={landlordProfileId}
          landlordName={landlordName}
          catalog={catalog}
          onClose={() => setAdding(false)}
          onSaved={saved}
        />
      )}
      {revoking && (
        <RevokeModal landlordProfileId={landlordProfileId} override={revoking} onClose={() => setRevoking(null)} onSaved={saved} />
      )}
    </section>
  );
}
