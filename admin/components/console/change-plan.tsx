"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ErrorBox, WarningBox, goToSessionExpired, inputClass, primaryButtonClass, secondaryButtonClass } from "@/components/console/ui";
import { formatPrice, initials } from "@/lib/format";
import { findViolations } from "@/lib/plan-check";
import { sendProposalAction } from "@/lib/proposal-actions";
import { loadLandlordSubscriptionAction } from "@/lib/subscription-actions";
import type { AdminLandlordSubscription, AdminPackage, LimitViolation, SendProposalResult } from "@/lib/types";

interface Props {
  landlordProfileId: number;
  landlordName: string;
  packages: AdminPackage[];
}

// The "Propose plan" button of one landlord, plus the popup it opens.
//
// A plan is never changed by staff alone: the popup SENDS A PROPOSAL, the landlord is emailed an approve link, and the
// plan changes only when they approve it. Flow: click -> popup loads the landlord's usage -> pick a plan (usage is
// checked against it straight away) -> optional message and private note -> "Send for approval".
export function ChangePlanButton({ landlordProfileId, landlordName, packages }: Props) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  // The landlord's current plan and usage. null while it is loading.
  const [subscription, setSubscription] = useState<AdminLandlordSubscription | null>(null);
  const [loadError, setLoadError] = useState("");

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [staffNote, setStaffNote] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  // The backend's answer when it did not create a proposal (over the limits, already there, ...).
  const [refused, setRefused] = useState<SendProposalResult | null>(null);

  // Close on Escape, but not in the middle of sending.
  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !submitting) close();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  async function openDialog() {
    // Start from a clean form every time.
    setOpen(true);
    setSubscription(null);
    setLoadError("");
    setSelectedId(null);
    setMessage("");
    setStaffNote("");
    setError("");
    setRefused(null);

    const result = await loadLandlordSubscriptionAction(landlordProfileId);
    if ("error" in result) {
      if (result.expired) return goToSessionExpired();
      setLoadError(result.error);
      return;
    }
    setSubscription(result.data);
  }

  function close() {
    setOpen(false);
  }

  // ---- What the form shows ------------------------------------------------------------------------------------

  const currentPackageId = subscription?.subscription.packageId ?? null;
  const currentPackage = packages.find((p) => p.packageId === currentPackageId);
  // Inactive (legacy) plans are hidden, except the one the landlord is already on.
  const choices = packages
    .filter((p) => p.isActive || p.packageId === currentPackageId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const selected = packages.find((p) => p.packageId === selectedId);

  // Limits the landlord's usage would break on the chosen plan (a preview; the backend decides). A landlord over the
  // limits could not accept the plan, so the proposal is blocked.
  const violations: LimitViolation[] =
    subscription && selected ? findViolations(selected, currentPackage, subscription.subscription) : [];

  const canSubmit = !!selected && violations.length === 0 && !submitting;

  // ---- Sending ------------------------------------------------------------------------------------------------

  async function submit() {
    if (!selected) return;
    setSubmitting(true);
    setError("");
    setRefused(null);

    const result = await sendProposalAction({ landlordProfileId, packageId: selected.packageId, message, staffNote });

    setSubmitting(false);
    if ("error" in result) {
      if (result.expired) return goToSessionExpired();
      setError(result.error);
      return;
    }
    if (result.result.outcome !== "proposed") {
      setRefused(result.result);
      return;
    }

    close();
    // Reload so the row shows "Awaiting customer".
    router.refresh();
  }

  return (
    <>
      <button type="button" onClick={openDialog} className={`${secondaryButtonClass} h-9 w-full`}>
        Propose plan
      </button>

      {/* Drawn into the page wrapper (a "portal"), not inside the animated card that holds the button: a card
          that fades in with a transform would otherwise squash this "fixed" popup into its own corner. */}
      {open &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
            {/* Dimmed backdrop. Clicking it closes the popup. */}
            <button type="button" aria-label="Close" disabled={submitting} onClick={close} className="absolute inset-0 bg-black/45" />

            <div
              role="dialog"
              aria-modal="true"
              aria-label={`Propose a plan change for ${landlordName}`}
              className="animate-up relative max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border border-c-bd bg-c-sf p-6 text-c-tx sm:max-w-md sm:rounded-3xl"
            >
              {/* Header: who we are proposing to, and their current plan. */}
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-c-aci text-xs font-medium text-c-act2">
                  {initials(landlordName)}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-medium">Propose a plan change</h2>
                  <p className="truncate text-xs text-c-tx2">
                    {landlordName}
                    {subscription && ` · currently ${subscription.subscription.packageName ?? "no plan"}`}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Close"
                  disabled={submitting}
                  onClick={close}
                  className="flex size-9 items-center justify-center rounded-[10px] text-c-tx2 hover:bg-c-sf2"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Loading and error states while we fetch the landlord's usage. */}
              {!subscription && !loadError && <p className="mt-6 text-[13px] text-c-tx2">Loading plan and usage…</p>}
              {loadError && (
                <div className="mt-5 flex flex-col gap-3">
                  <ErrorBox message={loadError} />
                  <button type="button" onClick={close} className={secondaryButtonClass}>
                    Close
                  </button>
                </div>
              )}

              {subscription && (
                <div className="mt-5 flex flex-col gap-4">
                  {/* Step 1: pick the plan. The current one is shown but can't be chosen. */}
                  <fieldset className="flex flex-col gap-2">
                    <legend className="mb-1 text-xs text-c-tx2">Choose a plan</legend>
                    {choices.map((plan) => {
                      const isCurrent = plan.packageId === currentPackageId;
                      const isSelected = plan.packageId === selectedId;
                      return (
                        <button
                          key={plan.packageId}
                          type="button"
                          disabled={isCurrent || submitting}
                          onClick={() => {
                            setSelectedId(plan.packageId);
                            setError("");
                            setRefused(null);
                          }}
                          className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                            isSelected
                              ? "border-c-ac bg-c-aci text-c-act2"
                              : "border-c-bd hover:bg-c-sf2 disabled:opacity-50 disabled:hover:bg-transparent"
                          }`}
                        >
                          <span>
                            <span className="block text-sm font-medium">{plan.name}</span>
                            <span className="block text-xs text-c-tx2">
                              {isCurrent ? "Current plan" : plan.limits.map((l) => `${l.value} ${l.displayName.toLowerCase()}`).join(" · ")}
                            </span>
                          </span>
                          <span className="text-sm">{formatPrice(plan.monthlyPrice)}/mo</span>
                        </button>
                      );
                    })}
                  </fieldset>

                  {/* Step 2: could the landlord accept this plan with what they use today? */}
                  {selected && violations.length === 0 && (
                    <p className="rounded-xl bg-c-ok px-3 py-2.5 text-[13px] text-c-okt">They can accept: usage fits {selected.name}.</p>
                  )}
                  {selected && violations.length > 0 && (
                    <>
                      <ViolationList plan={selected.name} violations={violations} />
                      <p className="text-xs text-c-tx2">They could not accept this plan yet, so a proposal can&apos;t be sent.</p>
                    </>
                  )}

                  {/* Step 3: what the landlord reads, and a note only staff see. */}
                  <div className="flex flex-col gap-2">
                    <label htmlFor="proposal-message" className="text-xs text-c-tx2">
                      Message in the email and app (optional)
                    </label>
                    <textarea
                      id="proposal-message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      maxLength={500}
                      rows={3}
                      placeholder="For example: you can move to Pro for more room"
                      className={`${inputClass} h-auto py-2.5`}
                    />
                    <label htmlFor="proposal-note" className="text-xs text-c-tx2">
                      Private staff note (optional)
                    </label>
                    <textarea
                      id="proposal-note"
                      value={staffNote}
                      onChange={(e) => setStaffNote(e.target.value)}
                      maxLength={500}
                      rows={2}
                      className={`${inputClass} h-auto py-2.5`}
                    />
                  </div>

                  <p className="rounded-xl bg-c-wr px-3 py-2.5 text-[13px] text-c-wrt">
                    The plan changes only after {landlordName} approves it. We email them a link.
                  </p>

                  {/* The backend's answer when it did not send (over the limits, already on it, no plan). */}
                  {error && <ErrorBox message={error} />}
                  {refused && (
                    <div className="flex flex-col gap-2">
                      <ErrorBox message={refused.message ?? "The proposal was not sent."} />
                      {refused.violations.length > 0 && selected && <ViolationList plan={selected.name} violations={refused.violations} />}
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={close} disabled={submitting} className={secondaryButtonClass}>
                      Cancel
                    </button>
                    <button type="button" onClick={submit} disabled={!canSubmit} className={primaryButtonClass}>
                      {submitting ? "Sending…" : "Send for approval"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>,
          document.querySelector<HTMLElement>(".console") ?? document.body,
        )}
    </>
  );
}

// "Properties: 19 used, limit 2" lines with a full bar, shown when usage is above a plan's limit.
function ViolationList({ plan, violations }: { plan: string; violations: LimitViolation[] }) {
  return (
    <WarningBox>
      <span className="font-medium">Over the {plan} limit</span>
      <span className="mt-2 flex flex-col gap-2">
        {violations.map((v) => (
          <span key={v.limitKey} className="block">
            {v.displayName}: {v.used} used, limit {v.limit}
            <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-c-sf">
              <span className="block h-full w-full rounded-full bg-c-ac" />
            </span>
          </span>
        ))}
      </span>
    </WarningBox>
  );
}
