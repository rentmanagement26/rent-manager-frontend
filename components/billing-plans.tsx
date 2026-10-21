"use client";

// The "Change plan" list on the Billing page. Pressing Upgrade or Downgrade shows a preview first (does their usage fit?), then
// Confirm. No payment is taken because payments are not built yet.
import { useRouter } from "next/navigation";
import { useState } from "react";
import { changePlanAction, previewPlanChangeAction } from "@/lib/billing-actions";
import { limitText } from "@/lib/format-time";
import { goToSessionExpired } from "@/lib/session-expired-client";
import type { AvailablePlan, PlanChangePreview } from "@/lib/types";

const money = (value: number) => `$${value.toFixed(2)}/mo`;

interface Props {
  plans: AvailablePlan[];
  // The landlord's current monthly price; null when they have no plan yet.
  currentPrice: number | null;
}

export function BillingPlans({ plans, currentPrice }: Props) {
  const router = useRouter();
  // The plan being previewed, its preview (null while loading), and any error.
  const [picked, setPicked] = useState<{ plan: AvailablePlan; preview: PlanChangePreview | null } | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function choose(plan: AvailablePlan) {
    setError("");
    setPicked({ plan, preview: null });
    const result = await previewPlanChangeAction(plan.packageId);
    if ("error" in result) {
      if (result.expired) return goToSessionExpired();
      setPicked(null);
      setError(result.error);
      return;
    }
    setPicked({ plan, preview: result.preview });
  }

  async function confirm() {
    if (!picked) return;
    setSaving(true);
    setError("");
    const result = await changePlanAction(picked.plan.packageId);
    setSaving(false);

    if ("error" in result) {
      if (result.expired) return goToSessionExpired();
      setError(result.error);
      return;
    }
    setPicked(null);
    router.refresh();
  }

  return (
    <div className="max-w-xl rounded-2xl border border-default bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-heading">Change plan</h2>

      <ul className="mt-3">
        {plans.map((plan) => {
          const isPicked = picked?.plan.packageId === plan.packageId;
          const label = plan.isCurrent ? "Current plan" : currentPrice === null ? "Choose" : plan.monthlyPrice > currentPrice ? "Upgrade" : "Downgrade";
          return (
            <li key={plan.packageId} className="border-t border-default py-3 first:border-t-0">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-heading">
                    {plan.name} <span className="font-normal text-muted">{money(plan.monthlyPrice)}</span>
                  </p>
                  <p className="text-xs text-muted">{plan.limits.map((l) => limitText(l.value, l.displayName)).join(" · ")}</p>
                </div>
                {plan.isCurrent ? (
                  <span className="text-xs font-semibold text-muted">Current plan</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => choose(plan)}
                    disabled={saving}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-60 ${
                      label === "Downgrade" ? "border border-default text-body hover:bg-subtle" : "bg-accent text-white hover:bg-accent-dark"
                    }`}
                  >
                    {label}
                  </button>
                )}
              </div>

              {isPicked && (
                <div className="mt-3 space-y-3 rounded-xl bg-subtle px-4 py-3 text-sm text-body">
                  {picked.preview === null && <p>Checking your usage…</p>}
                  {picked.preview && picked.preview.canChange && (
                    <>
                      <p>
                        Your usage fits {plan.name}. Your plan changes right away to {money(plan.monthlyPrice)}. No payment is taken yet,
                        because payments are not set up.
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={confirm}
                          disabled={saving}
                          className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-60"
                        >
                          {saving ? "Changing…" : `Confirm ${plan.name}`}
                        </button>
                        <button
                          type="button"
                          onClick={() => setPicked(null)}
                          disabled={saving}
                          className="rounded-xl border border-default px-4 py-2 text-sm font-semibold hover:bg-white"
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  )}
                  {picked.preview && !picked.preview.canChange && (
                    <>
                      <p className="font-semibold text-red-700">{plan.name} can&apos;t be chosen yet.</p>
                      {picked.preview.violations.map((v) => (
                        <p key={v.limitKey}>
                          {v.displayName}: {v.used} used, limit {v.limit}. Reduce usage first.
                        </p>
                      ))}
                      {picked.preview.alreadyOnPlan && <p>You are already on this plan.</p>}
                      <button
                        type="button"
                        onClick={() => setPicked(null)}
                        className="rounded-xl border border-default px-4 py-2 text-sm font-semibold hover:bg-white"
                      >
                        Close
                      </button>
                    </>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
    </div>
  );
}
