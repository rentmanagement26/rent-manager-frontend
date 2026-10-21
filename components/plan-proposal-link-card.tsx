"use client";

// The confirm card of the emailed Accept / Decline link: shows what would change and lets the landlord answer.
// The button named in the email is only highlighted; nothing is sent until the landlord presses a button.
import Link from "next/link";
import { useState } from "react";
import { PlanChangeSummary } from "@/components/plan-change-summary";
import { answerByLinkAction } from "@/lib/proposal-link-actions";
import { formatCalendarDate } from "@/lib/format-time";
import type { PendingPlanChange, PlanSnapshot } from "@/lib/types";

interface Props {
  token: string;
  // "accept" or "decline" from the email button; highlights that button.
  highlight: "accept" | "decline" | null;
  current: PlanSnapshot;
  target: PlanSnapshot;
  changes: PendingPlanChange["changes"];
  message: string | null;
  expiresAt: string | null;
}

// A short result card (answered, expired, no longer active) with an optional link.
export function LinkMessage({ title, text, loginLink = false }: { title: string; text: string; loginLink?: boolean }) {
  return (
    <div>
      <h2 className="font-head text-xl font-bold text-heading">{title}</h2>
      <p className="mt-2 text-sm text-muted">{text}</p>
      {loginLink && (
        <Link href="/login" className="mt-5 inline-block text-sm font-semibold text-accent hover:text-accent-dark">
          Log in to DomusPRO
        </Link>
      )}
    </div>
  );
}

export function PlanProposalLinkCard({ token, highlight, current, target, changes, message, expiresAt }: Props) {
  const [working, setWorking] = useState<"accept" | "decline" | null>(null);
  const [error, setError] = useState("");
  // What happened after pressing a button; replaces the buttons.
  const [result, setResult] = useState<"accepted" | "declined" | "expired" | "closed" | null>(null);

  async function respond(accept: boolean) {
    setWorking(accept ? "accept" : "decline");
    setError("");
    const answer = await answerByLinkAction(token, accept);
    setWorking(null);

    if ("ok" in answer) return setResult(accept ? "accepted" : "declined");
    if (answer.code === "expired") return setResult("expired");
    if (answer.code === "not_open" || answer.code === "not_found") return setResult("closed");
    setError(answer.error);
  }

  if (result === "accepted") {
    return <LinkMessage title={`You're now on ${target.name}`} text="Your plan changed right away. We emailed you a confirmation." loginLink />;
  }
  if (result === "declined") {
    return <LinkMessage title="Proposal declined" text={`Nothing changed. You stay on ${current.name}.`} />;
  }
  if (result === "expired") {
    return <LinkMessage title="This proposal has expired" text="Contact support if you still want to change your plan." />;
  }
  if (result === "closed") {
    return <LinkMessage title="This link is no longer active" text="It may have been answered, withdrawn or replaced by a newer email." />;
  }

  const ring = "ring-4 ring-accent-tint";

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-head text-xl font-bold text-heading">
          Move from {current.name} to {target.name}?
        </h2>
        <p className="mt-1 text-sm text-muted">DomusPRO support suggested this change. Your plan stays as it is unless you accept.</p>
      </div>

      {message && <p className="rounded-xl bg-subtle px-4 py-3 text-sm text-body">{message}</p>}

      <PlanChangeSummary changes={changes} />

      <p className="text-xs text-muted">
        {expiresAt ? `Open until ${formatCalendarDate(/[zZ]|[+-]\d\d:?\d\d$/.test(expiresAt) ? expiresAt : `${expiresAt}Z`)}. ` : ""}You can also answer after you{" "}
        <Link href="/login?redirect=%2Flandlord%2Fplan-proposals" className="font-semibold text-accent hover:text-accent-dark">
          sign in
        </Link>
        .
      </p>

      {error && <p className="text-sm text-red-700">{error}</p>}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => respond(true)}
          disabled={working !== null}
          className={`rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-60 ${
            highlight === "accept" ? ring : ""
          }`}
        >
          {working === "accept" ? "Accepting…" : `Accept ${target.name}`}
        </button>
        <button
          type="button"
          onClick={() => respond(false)}
          disabled={working !== null}
          className={`rounded-xl border border-default px-5 py-2.5 text-sm font-semibold text-body hover:bg-subtle disabled:opacity-60 ${
            highlight === "decline" ? ring : ""
          }`}
        >
          {working === "decline" ? "Declining…" : "Decline"}
        </button>
      </div>
    </div>
  );
}
