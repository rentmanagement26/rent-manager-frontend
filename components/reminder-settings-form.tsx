"use client";

// The renewal reminder settings: whether to get reminders, how (email, in the app and phone), the usual notice period, and which days before the
// lease ends to remind on, grouped around the notice date, with a timeline and a preview of the message. Up to 8 reminders, each 1 to 365 days.
// On a plan without reminders the form is shown locked, with a link to Billing.
import Link from "next/link";
import { useState } from "react";
import { saveReminderSettingsAction } from "@/lib/reminder-actions";
import type { ReminderSettings } from "@/lib/reminder-api";
import { goToSessionExpired } from "@/lib/session-expired-client";

const MAX_REMINDERS = 8;
// Days offered as ready-made choices. "Optional" ones are off in the backend's defaults.
const PRESETS = [180, 120, 60, 30, 14, 7];
const OPTIONAL = new Set([180, 14]);

const primaryButton = "rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50";
const inputClass = "w-24 rounded-lg border border-default px-3 py-2 text-sm text-heading focus:border-accent focus:outline-none disabled:bg-slate-50";
const cardClass = "rounded-2xl border border-default bg-white p-5 shadow-sm";

// A round on/off switch.
function Switch({ checked, onChange, disabled, label }: { checked: boolean; onChange: (value: boolean) => void; disabled?: boolean; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${checked ? "bg-accent" : "bg-slate-300"}`}
    >
      <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${checked ? "translate-x-5" : ""}`} />
    </button>
  );
}

export function ReminderSettingsForm({ initial }: { initial: ReminderSettings }) {
  const locked = !initial.available;
  const [enabled, setEnabled] = useState(initial.enabled);
  const [email, setEmail] = useState(initial.email);
  const [inApp, setInApp] = useState(initial.inApp);
  const [noticeDays, setNoticeDays] = useState(String(initial.noticeDays));
  const [stages, setStages] = useState<number[]>(initial.stages);
  const [overdueAlerts, setOverdueAlerts] = useState(initial.overdueAlerts);
  const [custom, setCustom] = useState("");
  const [previewTab, setPreviewTab] = useState<"email" | "phone">("email");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const off = locked || !enabled;
  const notice = Number(noticeDays);
  const noticeValid = Number.isInteger(notice) && notice >= 14 && notice <= 365;
  const noticeDay = noticeValid ? notice : initial.noticeDays;

  // Every day shown as a chip: the presets, the notice date and anything custom already chosen, largest first.
  const candidates = [...new Set([...PRESETS, noticeDay, ...stages])].sort((a, b) => b - a);
  const before = candidates.filter((day) => day > noticeDay);
  const after = candidates.filter((day) => day < noticeDay);
  const isCustom = (day: number) => !PRESETS.includes(day) && day !== noticeDay;

  function toggle(day: number) {
    setStages((current) => (current.includes(day) ? current.filter((d) => d !== day) : current.length >= MAX_REMINDERS ? current : [...current, day]));
  }

  function addCustom() {
    const day = Number(custom);
    if (!Number.isInteger(day) || day < 1 || day > 365) return setError("A reminder day must be 1 to 365.");
    if (stages.length >= MAX_REMINDERS && !stages.includes(day)) return setError(`You can have up to ${MAX_REMINDERS} reminders.`);
    setError("");
    setStages((current) => (current.includes(day) ? current : [...current, day]));
    setCustom("");
  }

  async function save() {
    setBusy(true);
    setError("");
    setSaved(false);
    const answer = await saveReminderSettingsAction({
      enabled,
      email,
      inApp,
      noticeDays: notice,
      stages: [...stages].sort((a, b) => b - a),
      overdueAlerts,
    });
    setBusy(false);
    if ("error" in answer) return answer.expired ? goToSessionExpired() : setError(answer.error);
    setSaved(true);
  }

  // One chip: a day that is on (orange) or off (white); a custom day also has a remove cross.
  function Chip({ day }: { day: number }) {
    const on = stages.includes(day);
    return (
      <span className="inline-flex items-center">
        <button
          type="button"
          disabled={off || (!on && stages.length >= MAX_REMINDERS)}
          aria-pressed={on}
          onClick={() => toggle(day)}
          className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${on ? "border-accent bg-accent-tint text-accent-dark" : "border-default bg-white text-body hover:border-accent"}`}
        >
          {day} days
          {OPTIONAL.has(day) && <span className="ml-1 text-[11px] font-normal text-muted">optional</span>}
          {day === noticeDay && <span className="ml-1 text-[11px] font-normal text-accent-dark">your notice period</span>}
        </button>
        {isCustom(day) && on && (
          <button type="button" disabled={off} onClick={() => toggle(day)} aria-label={`Remove the ${day} day reminder`} className="ml-1 text-xs font-semibold text-muted hover:text-heading">
            ✕
          </button>
        )}
      </span>
    );
  }

  // The timeline: the longest reminder on the left, the lease end on the right, a tick for each chosen day.
  const span = Math.max(180, ...stages, noticeDay);
  const leftFor = (day: number) => `${((span - day) / span) * 100}%`;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-5">
        {locked && (
          <div className="rounded-2xl border border-accent/30 bg-accent-tint px-5 py-4 text-sm text-accent-dark">
            <p className="font-semibold">Renewal reminders are not part of your plan.</p>
            <p className="mt-1">You can still record a decision for each lease on the Renewals page. Reminders by email and in the app are a paid feature.</p>
            <Link href="/landlord/billing" className="mt-2 inline-block font-semibold text-accent hover:text-accent-dark">See plans</Link>
          </div>
        )}

        <section className={`${cardClass} flex items-center justify-between gap-4`}>
          <span>
            <span className="block text-sm font-semibold text-heading">Enable lease renewal reminders</span>
            <span className="block text-xs text-muted">Email, in-app and phone reminders for active leases that have an end date. They go only to you, never to your tenants.</span>
          </span>
          <span className="flex items-center gap-2 text-xs font-semibold text-muted">
            <Switch checked={enabled} onChange={setEnabled} disabled={locked} label="Enable lease renewal reminders" />
            {enabled ? "On" : "Off"}
          </span>
        </section>

        <div className={`grid gap-5 md:grid-cols-2 ${off ? "opacity-60" : ""}`}>
          <section className={cardClass}>
            <h2 className="text-sm font-semibold text-heading">Delivery methods</h2>
            <p className="text-xs text-muted">At least one is required.</p>
            <label className="mt-3 flex cursor-pointer items-start gap-2 text-sm">
              <input type="checkbox" className="mt-1" checked={email} disabled={off} onChange={(event) => setEmail(event.target.checked)} />
              <span>Email<span className="block text-xs text-muted">One email per day listing every lease that needs attention.</span></span>
            </label>
            <label className="mt-3 flex cursor-pointer items-start gap-2 text-sm">
              <input type="checkbox" className="mt-1" checked={inApp} disabled={off} onChange={(event) => setInApp(event.target.checked)} />
              <span>In-app notification and phone push<span className="block text-xs text-muted">One notification per day, however many leases are due. It names the first three and opens your renewals.</span></span>
            </label>
          </section>

          <section className={cardClass}>
            <h2 className="text-sm font-semibold text-heading">Renewal notice period</h2>
            <p className="text-xs text-muted">How many days before the lease ends you want to send the renewal.</p>
            <div className="mt-3 flex items-center gap-2 text-sm">
              <input type="number" min={14} max={365} value={noticeDays} disabled={off} onChange={(event) => setNoticeDays(event.target.value)} className={inputClass} aria-label="Notice period in days" />
              days before lease end
            </div>
            {!noticeValid && <p className="mt-1 text-xs text-red-700">14 to 365 days.</p>}
            <p className="mt-3 text-xs text-muted">Default 90. Notice rules differ by province, so check yours. You can change this for a single lease on its details page.</p>
          </section>
        </div>

        <section className={`${cardClass} ${off ? "opacity-60" : ""}`}>
          <h2 className="text-sm font-semibold text-heading">When to remind me</h2>
          <p className="text-xs text-muted">Counted in days before the lease ends. The days around your notice period follow what you set above.</p>

          <div className="relative mx-2 mb-10 mt-8 h-2 rounded-full bg-slate-200" aria-hidden>
            {stages.map((day) => (
              <span key={day} className={`absolute -top-1.5 h-5 w-1 -translate-x-1/2 rounded-full ${day === noticeDay ? "bg-accent" : "bg-slate-500"}`} style={{ left: leftFor(day) }}>
                <span className="absolute left-1/2 top-6 -translate-x-1/2 whitespace-nowrap text-[10px] text-muted">{day} d</span>
              </span>
            ))}
            <span className="absolute -top-1.5 right-0 h-5 w-1 translate-x-1/2 rounded-full bg-red-500">
              <span className="absolute right-0 top-6 whitespace-nowrap text-[10px] font-semibold text-red-700">Lease ends</span>
            </span>
          </div>

          <div className="space-y-5">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted">Planning · before your notice date</p>
              <div className="mt-2 flex flex-wrap gap-2">{before.map((day) => <Chip key={day} day={day} />)}{before.length === 0 && <span className="text-xs text-muted">Nothing earlier than your notice period.</span>}</div>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted">Send your renewal · on your notice date</p>
              <div className="mt-2 flex flex-wrap gap-2"><Chip day={noticeDay} /></div>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted">If no renewal has been sent · after your notice date</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {after.map((day) => <Chip key={day} day={day} />)}
                <span className="inline-flex items-center gap-1.5">
                  <input type="number" min={1} max={365} placeholder="Days" value={custom} disabled={off} onChange={(event) => setCustom(event.target.value)} className={`${inputClass} w-20`} aria-label="Add a reminder day" />
                  <button type="button" disabled={off || custom === ""} onClick={addCustom} className="text-sm font-semibold text-accent hover:text-accent-dark disabled:text-muted">+ Add a reminder (1–365 days)</button>
                </span>
              </div>
            </div>
          </div>
          <p className="mt-4 text-xs text-muted">
            {stages.length} of {MAX_REMINDERS} reminders. You never get more than one notification and one email per day.
          </p>
        </section>

        <section className={`${cardClass} ${off ? "opacity-60" : ""}`}>
          <h2 className="text-sm font-semibold text-heading">More options</h2>
          <label className="mt-3 flex cursor-pointer items-start gap-2 text-sm">
            <input type="checkbox" className="mt-1" checked={overdueAlerts} disabled={off} onChange={(event) => setOverdueAlerts(event.target.checked)} />
            <span>Remind me after the lease end date if nothing is recorded<span className="block text-xs text-muted">Two reminders: on the end date and 7 days after. Then it stops.</span></span>
          </label>
          <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-muted">Reminders for a lease stop automatically once you record a decision on the Renewals page.</p>
        </section>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">{error}</p>}
        {saved && <p className="rounded-lg bg-green-50 px-3 py-2.5 text-sm font-medium text-green-700">Settings saved.</p>}

        <div className="flex gap-3">
          <button type="button" onClick={save} disabled={busy || locked || !noticeValid} className={primaryButton}>{busy ? "Saving…" : "Save settings"}</button>
          <Link href="/landlord/renewals" className="rounded-full border border-default bg-white px-5 py-2.5 text-sm font-semibold text-heading hover:bg-subtle">Back to Renewals</Link>
        </div>
      </div>

      <aside className="h-fit space-y-4 xl:sticky xl:top-4">
        <section className={cardClass}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-heading">Preview</h2>
            <span className="text-[11px] text-muted">An example, not your leases</span>
          </div>
          <p className="mt-1 text-xs text-muted">One email and one notification per day, even when several leases are due.</p>
          <div className="mt-3 grid grid-cols-2 gap-1 rounded-full bg-slate-100 p-1 text-xs font-semibold">
            {(["email", "phone"] as const).map((tab) => (
              <button key={tab} type="button" onClick={() => setPreviewTab(tab)} aria-pressed={previewTab === tab} className={`rounded-full py-1.5 ${previewTab === tab ? "bg-accent text-white" : "text-body"}`}>
                {tab === "email" ? "Email" : "Phone"}
              </button>
            ))}
          </div>

          {previewTab === "email" ? (
            <div className="mt-3 rounded-xl border border-default p-4 text-sm">
              <p className="font-bold text-heading">DomusPRO</p>
              <p className="mt-2 font-semibold text-heading">3 leases need your attention</p>
              <ul className="mt-2 space-y-2 text-xs text-body">
                <li>Unit 204, Sunset Apartments ends on Jun 30 (in {noticeDay} days). Send the renewal by Apr 1. <span className="font-semibold text-accent">Open lease</span></li>
                <li>Unit 12, Oak Court ends in 45 days and no renewal is recorded. <span className="font-semibold text-accent">Open lease</span></li>
                <li>The lease for Unit 7, Pine Place ended on Mar 29 and no renewal is recorded. Update the lease or mark it as not renewing. <span className="font-semibold text-accent">Open lease</span></li>
              </ul>
            </div>
          ) : (
            <div className="mt-3 rounded-2xl bg-heading p-4 text-white">
              <p className="text-center text-2xl font-bold">9:41</p>
              <div className="mt-3 rounded-xl bg-white/15 p-3 text-xs">
                <p className="font-semibold text-accent-tint">DOMUSPRO · now</p>
                <p className="mt-0.5 font-semibold">3 leases need your attention</p>
                <p className="mt-0.5 text-white/80">Unit 204, Unit 12 and Unit 7. Open your lease renewals to see what each one needs.</p>
              </div>
            </div>
          )}
        </section>

        <p className="rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-800">
          Reminder only. DomusPRO does not check or advise on notice rules. Please confirm the rules that apply to your tenancy.
        </p>
      </aside>
    </div>
  );
}
