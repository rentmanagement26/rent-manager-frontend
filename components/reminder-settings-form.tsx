"use client";

// The renewal reminder settings: whether to get reminders, how (email, in the app), the usual notice period and which days before the end date to remind on.
// On a plan without reminders the form is shown locked, with a link to Billing.
import Link from "next/link";
import { useState } from "react";
import { saveReminderSettingsAction } from "@/lib/reminder-actions";
import type { ReminderSettings } from "@/lib/reminder-api";
import { goToSessionExpired } from "@/lib/session-expired-client";

// The days before the end date a reminder can go out on.
const STAGE_CHOICES = [120, 90, 60, 30, 7] as const;

const primaryButton = "rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50";
const inputClass = "w-24 rounded-lg border border-default px-3 py-2 text-sm text-heading focus:border-accent focus:outline-none disabled:bg-slate-50";

export function ReminderSettingsForm({ initial }: { initial: ReminderSettings }) {
  const locked = !initial.available;
  const [enabled, setEnabled] = useState(initial.enabled);
  const [email, setEmail] = useState(initial.email);
  const [inApp, setInApp] = useState(initial.inApp);
  const [noticeDays, setNoticeDays] = useState(String(initial.noticeDays));
  const [stages, setStages] = useState<number[]>(initial.stages);
  const [overdueAlerts, setOverdueAlerts] = useState(initial.overdueAlerts);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function save() {
    setBusy(true);
    setError("");
    setSaved(false);
    const answer = await saveReminderSettingsAction({
      enabled,
      email,
      inApp,
      noticeDays: Number(noticeDays),
      stages: [...stages].sort((a, b) => b - a),
      overdueAlerts,
    });
    setBusy(false);
    if ("error" in answer) return answer.expired ? goToSessionExpired() : setError(answer.error);
    setSaved(true);
  }

  const off = locked || !enabled;

  return (
    <div className="max-w-3xl space-y-5">
      {locked && (
        <div className="rounded-2xl border border-accent/30 bg-accent-tint px-5 py-4 text-sm text-accent-dark">
          <p className="font-semibold">Renewal reminders are not part of your plan.</p>
          <p className="mt-1">You can still record a decision for each lease on the Renewals page. Reminders by email and in the app are a paid feature.</p>
          <Link href="/landlord/billing" className="mt-2 inline-block font-semibold text-accent hover:text-accent-dark">See plans</Link>
        </div>
      )}

      <section className="rounded-2xl border border-default bg-white p-6 shadow-sm">
        <label className="flex cursor-pointer items-center justify-between gap-4">
          <span>
            <span className="block text-sm font-semibold text-heading">Remind me about lease renewals</span>
            <span className="block text-xs text-muted">We tell you before a fixed-term lease ends so you can decide in time. Reminders go only to you, never to your tenants.</span>
          </span>
          <input type="checkbox" checked={enabled} disabled={locked} onChange={(event) => setEnabled(event.target.checked)} className="h-5 w-5" />
        </label>
      </section>

      <section className={`rounded-2xl border border-default bg-white p-6 shadow-sm ${off ? "opacity-60" : ""}`}>
        <h2 className="text-sm font-semibold text-heading">How should we remind you?</h2>
        <div className="mt-3 flex flex-wrap gap-6 text-sm">
          <label className="flex cursor-pointer items-center gap-2"><input type="checkbox" checked={email} disabled={off} onChange={(event) => setEmail(event.target.checked)} /> By email</label>
          <label className="flex cursor-pointer items-center gap-2"><input type="checkbox" checked={inApp} disabled={off} onChange={(event) => setInApp(event.target.checked)} /> In the app (and phone)</label>
        </div>

        <h2 className="mt-6 text-sm font-semibold text-heading">Your usual notice period</h2>
        <p className="text-xs text-muted">How many days before a lease ends you plan to tell the tenant. Each lease can use its own period.</p>
        <div className="mt-2 flex items-center gap-2 text-sm">
          <input type="number" min={14} max={365} value={noticeDays} disabled={off} onChange={(event) => setNoticeDays(event.target.value)} className={inputClass} aria-label="Notice period in days" /> days
        </div>

        <h2 className="mt-6 text-sm font-semibold text-heading">Remind me this many days before the end</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {STAGE_CHOICES.map((days) => {
            const on = stages.includes(days);
            return (
              <button
                key={days}
                type="button"
                disabled={off}
                aria-pressed={on}
                onClick={() => setStages((current) => (on ? current.filter((d) => d !== days) : [...current, days]))}
                className={`rounded-full border px-4 py-1.5 text-sm font-semibold disabled:cursor-not-allowed ${on ? "border-accent bg-accent-tint text-accent-dark" : "border-default bg-white text-body hover:border-accent"}`}
              >
                {days} days
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-muted">You get one message per run covering all your leases, so your phone isn&apos;t flooded.</p>

        <label className="mt-6 flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" checked={overdueAlerts} disabled={off} onChange={(event) => setOverdueAlerts(event.target.checked)} />
          Also remind me on the end day and a week later if I haven&apos;t decided
        </label>
      </section>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">{error}</p>}
      {saved && <p className="rounded-lg bg-green-50 px-3 py-2.5 text-sm font-medium text-green-700">Settings saved.</p>}

      <div className="flex gap-3">
        <button type="button" onClick={save} disabled={busy || locked} className={primaryButton}>{busy ? "Saving…" : "Save settings"}</button>
        <Link href="/landlord/renewals" className="rounded-full border border-default bg-white px-5 py-2.5 text-sm font-semibold text-heading hover:bg-subtle">Back to Renewals</Link>
      </div>
    </div>
  );
}
