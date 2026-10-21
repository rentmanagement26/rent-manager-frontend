"use client";

// The Catalog page body: lists features and limits, with popups to add or edit them.
// Features use the popup below; limits use the popups in limit-modal.tsx.

import { Pencil, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Modal } from "@/components/console/modal";
import {
  ErrorBox,
  Pill,
  cardClass,
  goToSessionExpired,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/console/ui";
import { AddLimitModal, EditLimitModal } from "@/components/console/limit-modal";
import { createFeatureAction, updateFeatureAction } from "@/lib/catalog-actions";
import type { ActionFailure, Catalog, CatalogFeature, CatalogLimit } from "@/lib/types";

// What the popup is doing right now. `null` means closed.
type Editing =
  | { kind: "new-feature" }
  | { kind: "feature"; feature: CatalogFeature }
  | { kind: "new-limit" }
  | { kind: "limit"; limit: CatalogLimit }
  | null;

// The feature popup. Adding a feature also asks for a key.
function CatalogModal({
  editing,
  onClose,
  onSaved,
}: {
  editing: { kind: "new-feature" } | { kind: "feature"; feature: CatalogFeature };
  onClose: () => void;
  onSaved: () => void;
}) {
  const feature = editing.kind === "feature" ? editing.feature : null;

  const [key, setKey] = useState("");
  const [name, setName] = useState(feature?.displayName ?? "");
  const [description, setDescription] = useState(feature?.description ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = name.trim().length >= 2 && (editing.kind !== "new-feature" || key.trim().length >= 3) && !submitting;

  async function submit() {
    setSubmitting(true);
    setError("");
    let result: { ok: true } | ActionFailure;
    if (editing.kind === "new-feature") {
      result = await createFeatureAction({ key, displayName: name, description });
    } else {
      result = await updateFeatureAction({ featureId: feature!.id, displayName: name, description });
    }
    setSubmitting(false);

    if ("error" in result) {
      if (result.expired) return goToSessionExpired();
      setError(result.error);
      return;
    }
    onSaved();
  }

  const title = editing.kind === "new-feature" ? "Add feature" : "Edit feature";

  return (
    <Modal title={title} subtitle={feature?.key} busy={submitting} onClose={onClose}>
      <div className="flex flex-col gap-4">
        {editing.kind === "new-feature" && (
          <div className="flex flex-col gap-2">
            <label htmlFor="catalog-key" className="text-xs text-c-tx2">
              Key (can&apos;t be changed later)
            </label>
            <input
              id="catalog-key"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              maxLength={60}
              placeholder="reports.export"
              className={inputClass}
            />
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label htmlFor="catalog-name" className="text-xs text-c-tx2">
            Display name
          </label>
          <input id="catalog-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} className={inputClass} />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="catalog-description" className="text-xs text-c-tx2">
            Description (optional)
          </label>
          <textarea
            id="catalog-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={300}
            rows={3}
            className={`${inputClass} h-auto py-2.5`}
          />
        </div>

        <ErrorBox message={error} />

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={submitting} className={secondaryButtonClass}>
            Cancel
          </button>
          <button type="button" onClick={submit} disabled={!canSubmit} className={primaryButtonClass}>
            {submitting ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// "Used by 2 plans" label for the list rows.
function usedBy(count: number) {
  return `Used by ${count} ${count === 1 ? "plan" : "plans"}`;
}

// Features and limits in two cards. `canEdit` hides the buttons for roles that may only look.
export function CatalogManager({ catalog, canEdit }: { catalog: Catalog; canEdit: boolean }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Editing>(null);

  // After any save: close the popup and reload the page data.
  function saved() {
    setEditing(null);
    router.refresh();
  }

  return (
    <>
      <section className={cardClass}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-medium">Features</h2>
          {canEdit && (
            <button
              type="button"
              onClick={() => setEditing({ kind: "new-feature" })}
              className={`${primaryButtonClass} flex items-center gap-1.5`}
            >
              <Plus size={16} /> Add feature
            </button>
          )}
        </div>
        <ul className="mt-4 flex flex-col">
          {catalog.features.map((feature) => (
            <li key={feature.id} className="flex items-start gap-3 border-t border-c-bd py-3 first:border-t-0 first:pt-0">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{feature.displayName}</p>
                <p className="font-mono text-xs text-c-tx3">{feature.key}</p>
                {feature.description && <p className="mt-1 text-[13px] text-c-tx2">{feature.description}</p>}
                <p className="mt-1 text-xs text-c-tx3">{usedBy(feature.usedByPackages)}</p>
              </div>
              {canEdit && (
                <button
                  type="button"
                  aria-label={`Edit ${feature.displayName}`}
                  onClick={() => setEditing({ kind: "feature", feature })}
                  className="flex size-9 shrink-0 items-center justify-center rounded-[10px] text-c-tx2 hover:bg-c-sf2"
                >
                  <Pencil size={16} />
                </button>
              )}
            </li>
          ))}
          {catalog.features.length === 0 && <li className="text-[13px] text-c-tx3">No features yet.</li>}
        </ul>
      </section>

      <section className={cardClass}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-medium">Limits</h2>
          {canEdit && (
            <button
              type="button"
              onClick={() => setEditing({ kind: "new-limit" })}
              className={`${primaryButtonClass} flex items-center gap-1.5`}
            >
              <Plus size={16} /> Add limit
            </button>
          )}
        </div>
        <p className="mt-1 text-[13px] text-c-tx2">
          A limit can only be added for something the system can count. You can rename limits but not remove them.
        </p>
        <ul className="mt-4 flex flex-col">
          {catalog.limits.map((limit) => (
            <li key={limit.id} className="flex items-start gap-3 border-t border-c-bd py-3 first:border-t-0 first:pt-0">
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                  {limit.displayName}
                  {!limit.usageCounted && <Pill className="bg-c-wr text-c-wrt">Not enforced</Pill>}
                </p>
                <p className="font-mono text-xs text-c-tx3">{limit.key}</p>
                <p className="mt-1 text-xs text-c-tx3">{usedBy(limit.usedByPackages)}</p>
                <p className="mt-1.5">
                  <Pill className={limit.mayStayWhenLowered ? "bg-c-ok text-c-okt" : "bg-c-sf2 text-c-tx2"}>
                    {limit.mayStayWhenLowered ? "Landlords may stay when lowered" : "Moved to the new plan when lowered"}
                  </Pill>
                </p>
              </div>
              {canEdit && (
                <button
                  type="button"
                  aria-label={`Edit ${limit.displayName}`}
                  onClick={() => setEditing({ kind: "limit", limit })}
                  className="flex size-9 shrink-0 items-center justify-center rounded-[10px] text-c-tx2 hover:bg-c-sf2"
                >
                  <Pencil size={16} />
                </button>
              )}
            </li>
          ))}
          {catalog.limits.length === 0 && <li className="text-[13px] text-c-tx3">No limits.</li>}
        </ul>
      </section>

      {editing?.kind === "new-limit" && (
        <AddLimitModal metrics={catalog.availableMetrics ?? []} onClose={() => setEditing(null)} onSaved={saved} />
      )}
      {editing?.kind === "limit" && <EditLimitModal limit={editing.limit} onClose={() => setEditing(null)} onSaved={saved} />}
      {(editing?.kind === "new-feature" || editing?.kind === "feature") && (
        <CatalogModal
          editing={editing}
          onClose={() => setEditing(null)}
          onSaved={saved}
        />
      )}
    </>
  );
}
