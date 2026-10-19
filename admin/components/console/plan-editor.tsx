"use client";

// Buttons and popups for editing plans on the Plans page: add a plan, edit a plan's details, publish a new version.

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Modal } from "@/components/console/modal";
import { ErrorBox, goToSessionExpired, inputClass, primaryButtonClass, secondaryButtonClass } from "@/components/console/ui";
import { createPlanAction, publishPlanVersionAction, updatePlanDetailsAction } from "@/lib/package-actions";
import type { ActionFailure, AdminPackage, Catalog } from "@/lib/types";

type Result = { ok: true } | ActionFailure;

// Shared footer: error message plus Cancel / Save. Closes nothing itself; the parent decides.
function FormFooter({
  error,
  submitting,
  canSubmit,
  onClose,
  onSubmit,
  label,
}: {
  error: string;
  submitting: boolean;
  canSubmit: boolean;
  onClose: () => void;
  onSubmit: () => void;
  label: string;
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

// The price + limits + features fields, used for a new plan and for a new version.
// `values` holds the text of every field so the parent can read it when saving.
interface ContentValues {
  price: string;
  limits: Record<string, string>; // limit key -> text typed
  features: Set<string>; // feature keys switched on
}

function initialValues(catalog: Catalog, plan?: AdminPackage): ContentValues {
  const limits: Record<string, string> = {};
  for (const limit of catalog.limits) {
    const existing = plan?.limits.find((l) => l.key === limit.key);
    limits[limit.key] = String(existing?.value ?? 0);
  }
  return {
    price: String(plan?.monthlyPrice ?? 0),
    limits,
    features: new Set(plan?.features.map((f) => f.key) ?? []),
  };
}

// Turns the typed text into the numbers the action expects.
function toContent(values: ContentValues, catalog: Catalog) {
  return {
    monthlyPrice: Number(values.price),
    limits: catalog.limits.map((l) => ({ limitKey: l.key, value: Number(values.limits[l.key]) })),
    featureKeys: Array.from(values.features),
  };
}

// True when every number field holds something that parses as a number.
function contentComplete(values: ContentValues, catalog: Catalog) {
  const numbers = [values.price, ...catalog.limits.map((l) => values.limits[l.key])];
  return numbers.every((text) => text.trim() !== "" && Number.isFinite(Number(text)));
}

function ContentFields({
  catalog,
  values,
  onChange,
}: {
  catalog: Catalog;
  values: ContentValues;
  onChange: (next: ContentValues) => void;
}) {
  return (
    <>
      <div className="flex flex-col gap-2">
        <label htmlFor="plan-price" className="text-xs text-c-tx2">
          Monthly price
        </label>
        <input
          id="plan-price"
          inputMode="decimal"
          value={values.price}
          onChange={(e) => onChange({ ...values, price: e.target.value })}
          className={inputClass}
        />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-xs text-c-tx2">Limits</legend>
        {catalog.limits.map((limit) => (
          <div key={limit.key} className="flex items-center justify-between gap-3">
            <label htmlFor={`plan-limit-${limit.key}`} className="text-[13px]">
              {limit.displayName}
            </label>
            <input
              id={`plan-limit-${limit.key}`}
              inputMode="decimal"
              value={values.limits[limit.key]}
              onChange={(e) => onChange({ ...values, limits: { ...values.limits, [limit.key]: e.target.value } })}
              className={`${inputClass} w-28`}
            />
          </div>
        ))}
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-xs text-c-tx2">Features</legend>
        {catalog.features.map((feature) => (
          <label key={feature.key} className="flex items-center gap-2 text-[13px]">
            <input
              type="checkbox"
              checked={values.features.has(feature.key)}
              onChange={(e) => {
                const next = new Set(values.features);
                if (e.target.checked) next.add(feature.key);
                else next.delete(feature.key);
                onChange({ ...values, features: next });
              }}
            />
            {feature.displayName}
          </label>
        ))}
        {catalog.features.length === 0 && <p className="text-[13px] text-c-tx3">No features in the catalog yet.</p>}
      </fieldset>
    </>
  );
}

// Popup for a brand-new plan.
function NewPlanModal({ catalog, onClose, onSaved }: { catalog: Catalog; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [order, setOrder] = useState("0");
  const [values, setValues] = useState(() => initialValues(catalog));
  const { submitting, error, run } = useSubmit(onSaved);

  const canSubmit = name.trim().length >= 2 && order.trim() !== "" && contentComplete(values, catalog);

  return (
    <Modal title="Add plan" busy={submitting} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="plan-name" className="text-xs text-c-tx2">
            Name
          </label>
          <input id="plan-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} className={inputClass} />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="plan-order" className="text-xs text-c-tx2">
            Order (lower shows first)
          </label>
          <input id="plan-order" inputMode="numeric" value={order} onChange={(e) => setOrder(e.target.value)} className={inputClass} />
        </div>
        <ContentFields catalog={catalog} values={values} onChange={setValues} />
        <FormFooter
          error={error}
          submitting={submitting}
          canSubmit={canSubmit}
          onClose={onClose}
          label="Add plan"
          onSubmit={() =>
            run(() => createPlanAction({ name, sortOrder: Number(order), ...toContent(values, catalog) }))
          }
        />
      </div>
    </Modal>
  );
}

// Popup for publishing a new version of a plan's price, limits and features.
function NewVersionModal({
  plan,
  catalog,
  onClose,
  onSaved,
}: {
  plan: AdminPackage;
  catalog: Catalog;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [values, setValues] = useState(() => initialValues(catalog, plan));
  const [note, setNote] = useState("");
  const { submitting, error, run } = useSubmit(onSaved);

  const canSubmit = note.trim().length > 0 && contentComplete(values, catalog);

  return (
    <Modal title="Publish new version" subtitle={`${plan.name} · now on version ${plan.version}`} busy={submitting} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <ContentFields catalog={catalog} values={values} onChange={setValues} />
        <div className="flex flex-col gap-2">
          <label htmlFor="plan-note" className="text-xs text-c-tx2">
            Note (kept in the audit log)
          </label>
          <textarea
            id="plan-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
            rows={3}
            className={`${inputClass} h-auto py-2.5`}
          />
        </div>
        <FormFooter
          error={error}
          submitting={submitting}
          canSubmit={canSubmit}
          onClose={onClose}
          label="Publish"
          onSubmit={() =>
            run(() => publishPlanVersionAction({ packageId: plan.packageId, note, ...toContent(values, catalog) }))
          }
        />
      </div>
    </Modal>
  );
}

// Popup for a plan's name, order, on/off and default.
function DetailsModal({ plan, onClose, onSaved }: { plan: AdminPackage; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(plan.name);
  const [order, setOrder] = useState(String(plan.sortOrder));
  const [isActive, setIsActive] = useState(plan.isActive);
  const [isDefault, setIsDefault] = useState(plan.isDefault);
  const { submitting, error, run } = useSubmit(onSaved);

  const canSubmit = name.trim().length >= 2 && order.trim() !== "";

  return (
    <Modal title="Edit plan" subtitle={plan.name} busy={submitting} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="plan-name" className="text-xs text-c-tx2">
            Name
          </label>
          <input id="plan-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} className={inputClass} />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="plan-order" className="text-xs text-c-tx2">
            Order (lower shows first)
          </label>
          <input id="plan-order" inputMode="numeric" value={order} onChange={(e) => setOrder(e.target.value)} className={inputClass} />
        </div>
        <label className="flex items-center gap-2 text-[13px]">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          Active (landlords can be put on it)
        </label>
        {/* The backend keeps exactly one default: you move it by making another plan the default. */}
        <label className="flex items-center gap-2 text-[13px]">
          <input
            type="checkbox"
            checked={isDefault}
            disabled={plan.isDefault}
            onChange={(e) => setIsDefault(e.target.checked)}
          />
          Default plan for new landlords{plan.isDefault ? " (choose another plan to move this)" : ""}
        </label>
        <FormFooter
          error={error}
          submitting={submitting}
          canSubmit={canSubmit}
          onClose={onClose}
          label="Save"
          onSubmit={() =>
            run(() => updatePlanDetailsAction({ packageId: plan.packageId, name, sortOrder: Number(order), isActive, isDefault }))
          }
        />
      </div>
    </Modal>
  );
}

// The "Add plan" button at the top of the Plans page.
export function AddPlanButton({ catalog }: { catalog: Catalog }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={`${primaryButtonClass} flex items-center gap-1.5`}>
        <Plus size={16} /> Add plan
      </button>
      {open && (
        <NewPlanModal
          catalog={catalog}
          onClose={() => setOpen(false)}
          onSaved={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}

// The two buttons at the bottom of one plan card.
export function PlanCardActions({ plan, catalog }: { plan: AdminPackage; catalog: Catalog }) {
  const router = useRouter();
  const [open, setOpen] = useState<"details" | "version" | null>(null);

  function saved() {
    setOpen(null);
    router.refresh();
  }

  return (
    <>
      <div className="flex gap-2 border-t border-c-bd pt-4">
        <button type="button" onClick={() => setOpen("version")} className={`${secondaryButtonClass} flex-1`}>
          New version
        </button>
        <button type="button" onClick={() => setOpen("details")} className={`${secondaryButtonClass} flex-1`}>
          Edit details
        </button>
      </div>
      {open === "version" && <NewVersionModal plan={plan} catalog={catalog} onClose={() => setOpen(null)} onSaved={saved} />}
      {open === "details" && <DetailsModal plan={plan} onClose={() => setOpen(null)} onSaved={saved} />}
    </>
  );
}
