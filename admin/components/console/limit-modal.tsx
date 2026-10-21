"use client";

// The popups for limits on the Catalog page: "Add limit" (pick something the system can count) and
// "Edit limit" (rename it and choose whether landlords may stay when it is lowered).
import { useState } from "react";
import { Modal } from "@/components/console/modal";
import { ErrorBox, WarningBox, goToSessionExpired, inputClass, primaryButtonClass, secondaryButtonClass } from "@/components/console/ui";
import { createLimitAction, editLimitAction } from "@/lib/catalog-actions";
import type { ActionFailure, CatalogLimit, CatalogMetric } from "@/lib/types";

// The on/off switch used for "Landlords may stay when lowered".
function StaySwitch({ on, onChange, disabled }: { on: boolean; onChange: (value: boolean) => void; disabled: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label="Landlords may stay when lowered"
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${on ? "bg-c-ac" : "bg-c-bd2"}`}
    >
      <span className={`absolute top-0.5 size-4 rounded-full bg-c-sf transition-all ${on ? "left-4.5" : "left-0.5"}`} />
    </button>
  );
}

// Label and explanation next to the switch.
function StayRow({ on, onChange, disabled, hint }: { on: boolean; onChange: (value: boolean) => void; disabled: boolean; hint: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-[13px] font-medium">Landlords may stay when lowered</p>
        <p className="text-xs text-c-tx2">{hint}</p>
      </div>
      <StaySwitch on={on} onChange={onChange} disabled={disabled} />
    </div>
  );
}

// Runs a save, shows the backend's error inside the popup, and calls onSaved on success.
function useSave(onSaved: () => void) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function run(action: () => Promise<{ ok: true } | ActionFailure>) {
    setSubmitting(true);
    setError("");
    const result = await action();
    setSubmitting(false);

    if ("error" in result) {
      if (result.expired) return goToSessionExpired();
      setError(result.error);
      return;
    }
    onSaved();
  }
  return { submitting, error, run };
}

// "Add limit": choose one of the countable things that has no limit yet.
export function AddLimitModal({
  metrics,
  onClose,
  onSaved,
}: {
  metrics: CatalogMetric[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [metricKey, setMetricKey] = useState("");
  const [name, setName] = useState("");
  const [mayStay, setMayStay] = useState(false);
  const { submitting, error, run } = useSave(onSaved);

  const chosen = metrics.find((m) => m.key === metricKey);

  return (
    <Modal title="Add limit" subtitle="Choose something the system can already count." busy={submitting} onClose={onClose}>
      {metrics.length === 0 ? (
        <div className="flex flex-col gap-4">
          <p className="text-[13px] text-c-tx2">Everything the system can count already has a limit.</p>
          <div className="flex justify-end">
            <button type="button" onClick={onClose} className={secondaryButtonClass}>
              Close
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-xs text-c-tx2">What to limit</legend>
            {metrics.map((metric) => (
              <button
                key={metric.key}
                type="button"
                disabled={submitting}
                onClick={() => {
                  setMetricKey(metric.key);
                  setName(metric.displayName);
                }}
                className={`rounded-2xl border px-4 py-3 text-left transition ${
                  metric.key === metricKey ? "border-c-ac bg-c-aci text-c-act2" : "border-c-bd hover:bg-c-sf2"
                }`}
              >
                <span className="block text-sm font-medium">{metric.displayName}</span>
                <span className="block text-xs text-c-tx2">{metric.description}</span>
              </button>
            ))}
          </fieldset>

          <div className="flex flex-col gap-2">
            <label htmlFor="limit-name" className="text-xs text-c-tx2">
              Display name (optional)
            </label>
            <input
              id="limit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              placeholder={chosen?.displayName ?? ""}
              className={inputClass}
            />
          </div>

          <StayRow
            on={mayStay}
            onChange={setMayStay}
            disabled={submitting}
            hint="If a new plan version only lowers this limit, they can keep their current plan."
          />

          <WarningBox>The key is fixed once created. Add the limit to a plan from Plans.</WarningBox>
          <ErrorBox message={error} />

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} disabled={submitting} className={secondaryButtonClass}>
              Cancel
            </button>
            <button
              type="button"
              onClick={() => run(() => createLimitAction({ metricKey, displayName: name, mayStayWhenLowered: mayStay }))}
              disabled={!metricKey || submitting}
              className={primaryButtonClass}
            >
              {submitting ? "Adding…" : "Add limit"}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

// "Edit limit": rename it and set whether landlords may stay when it is lowered.
export function EditLimitModal({ limit, onClose, onSaved }: { limit: CatalogLimit; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(limit.displayName);
  const [mayStay, setMayStay] = useState(limit.mayStayWhenLowered);
  const { submitting, error, run } = useSave(onSaved);

  return (
    <Modal title="Edit limit" subtitle={limit.key} busy={submitting} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="limit-name" className="text-xs text-c-tx2">
            Display name
          </label>
          <input id="limit-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} className={inputClass} />
        </div>

        <StayRow
          on={mayStay}
          onChange={setMayStay}
          disabled={submitting}
          hint="Affects future plan changes only. A change already planned keeps the rule it was given."
        />

        <ErrorBox message={error} />

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={submitting} className={secondaryButtonClass}>
            Cancel
          </button>
          <button
            type="button"
            onClick={() => run(() => editLimitAction({ limitTypeId: limit.id, displayName: name, mayStayWhenLowered: mayStay }))}
            disabled={name.trim().length < 2 || submitting}
            className={primaryButtonClass}
          >
            {submitting ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
