"use client";

// The status banner at the top of the Billing page: a free trial running, a plan that ends at the end of the period (with Undo),
// or a lower plan booked for the end of the period (with Keep my plan), or a payment that failed.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { dropPendingChangeAction, undoCancelAction } from "@/lib/billing-actions";
import { dayText, pricePer } from "@/lib/billing-format";
import { goToSessionExpired } from "@/lib/session-expired-client";
import type { MyBilling } from "@/lib/types";

interface Props {
  billing: MyBilling;
  currentName: string;
  // The name of the plan booked for the end of the period, when there is one.
  pendingName: string | null;
  // The current plan's price per billing period, for the trial sentence.
  currentPrice: number | null;
}

const bannerClass = "flex max-w-5xl flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm";
const bannerButton = "rounded-full border border-current bg-white/70 px-4 py-1.5 text-xs font-semibold hover:bg-white disabled:opacity-50";

export function BillingBanner({ billing, currentName, pendingName, currentPrice }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Runs one of the two undo actions, then reloads the page behind the banner.
  async function run(action: () => Promise<{ ok: true } | { error: string; expired: boolean }>) {
    setBusy(true);
    setError("");
    const result = await action();
    setBusy(false);
    if ("error" in result) return result.expired ? goToSessionExpired() : setError(result.error);
    router.refresh();
  }

  if (!billing.hasStripeSubscription) return null;
  const interval = billing.interval ?? "month";

  let content: React.ReactNode = null;
  let tone = "bg-accent-tint text-body";

  if (billing.cancelAtPeriodEnd) {
    tone = "bg-amber-50 text-amber-800";
    content = (
      <>
        <span>Your plan ends on {billing.currentPeriodEnd ? dayText(billing.currentPeriodEnd) : "the end of the period"}. You keep {currentName} until then.</span>
        <button type="button" disabled={busy} onClick={() => run(undoCancelAction)} className={bannerButton}>Undo cancel</button>
      </>
    );
  } else if (billing.pendingPackageId && pendingName) {
    tone = "bg-amber-50 text-amber-800";
    content = (
      <>
        <span>Your plan changes from {currentName} to {pendingName} on {billing.pendingChangeAt ? dayText(billing.pendingChangeAt) : "the end of the period"}. Until then you keep {currentName}.</span>
        <button type="button" disabled={busy} onClick={() => run(dropPendingChangeAction)} className={bannerButton}>Keep {currentName}</button>
      </>
    );
  } else if (billing.status === "past_due") {
    tone = "bg-red-50 text-red-700";
    content = (
      <span>
        Your last payment didn&apos;t go through.{" "}
        <Link href="/landlord/settings#subscription" className="font-semibold underline">
          Update your card under Settings
        </Link>{" "}
        so you keep your plan.
      </span>
    );
  } else if (billing.status === "trialing" && billing.trialEndsAt) {
    content = (
      <span>
        Free trial until {dayText(billing.trialEndsAt)}.{currentPrice != null ? ` Then ${pricePer(currentPrice, interval)}.` : ""} Cancel before then and you pay nothing.
      </span>
    );
  }

  if (!content) return null;
  return (
    <div>
      <div className={`${bannerClass} ${tone}`}>{content}</div>
      {error && <p className="mt-2 max-w-5xl rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{error}</p>}
    </div>
  );
}
