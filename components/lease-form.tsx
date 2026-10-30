"use client";

// The edit-lease-details form: rent, term, deposits, who pays each utility and extra charges, saved together.
// Used on its own page (saves and goes back to the lease) and inside the Add lease stepper (`embedded`: saves, then hands the saved details back).
// Deposits are checked against the province's limits (lib/lease-rules.ts) before anything is sent.
import Link from "next/link";
import { useState } from "react";
import { saveLeaseDetailsAction, saveLeaseDetailsInlineAction } from "@/lib/tenancy-actions";
import { goToSessionExpired } from "@/lib/session-expired-client";
import {
  CHARGE_FREQUENCIES,
  CHARGE_TYPES,
  RESPONSIBILITY_OPTIONS,
  UTILITIES,
  toWire,
} from "@/lib/lease-format";
import { depositProblems, depositRule } from "@/lib/lease-rules";
import type { LeaseDetailsInput, TenancyDetails } from "@/lib/tenancy-types";

interface ChargeRow {
  type: string;
  description: string;
  amount: string;
  frequency: string;
}

const inputClass =
  "w-full rounded-lg border border-default px-3 py-2.5 text-sm text-heading placeholder:text-muted focus:border-accent focus:outline-none";
const labelClass = "text-sm font-medium text-heading";

// "2026-01-01T00:00:00Z" -> "2026-01-01" for a date input.
function dayOnly(value: string | null): string {
  return value ? value.slice(0, 10) : "";
}

// Empty text becomes null so an unset number stays unset.
function toNumber(text: string): number | null {
  const trimmed = text.trim();
  return trimmed === "" || Number.isNaN(Number(trimmed)) ? null : Number(trimmed);
}

export function LeaseForm({
  details,
  region,
  error,
  embedded,
}: {
  details: TenancyDetails;
  region: string;
  error?: string;
  // Set inside the Add lease stepper: the form saves in place and calls onSaved with the new details instead of leaving the page.
  embedded?: { onSaved: (details: TenancyDetails) => void; onCancel: () => void };
}) {
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [rent, setRent] = useState(details.monthlyRent?.toString() ?? "");
  const [dueDay, setDueDay] = useState(details.rentDueDay?.toString() ?? "1");
  const [termType, setTermType] = useState<"fixed" | "month_to_month">(details.termType === "Fixed" ? "fixed" : "month_to_month");
  const [startDate, setStartDate] = useState(dayOnly(details.startDate));
  const [endDate, setEndDate] = useState(dayOnly(details.endDate));
  const [security, setSecurity] = useState(details.securityDeposit?.toString() ?? "");
  const [pet, setPet] = useState(details.petDeposit?.toString() ?? "");
  const [utilities, setUtilities] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      UTILITIES.map((name) => {
        const saved = details.utilities.find((u) => toWire(u.utility) === name.toLowerCase());
        return [name.toLowerCase(), saved ? toWire(saved.responsibility) : "not_applicable"];
      })
    )
  );
  const [charges, setCharges] = useState<ChargeRow[]>(
    details.charges.map((c) => ({ type: toWire(c.type), description: c.description, amount: c.amount.toString(), frequency: toWire(c.frequency) }))
  );

  const rule = depositRule(region, toNumber(rent));
  const problems = depositProblems(rule, toNumber(security), toNumber(pet));

  const payload: LeaseDetailsInput = {
    monthlyRent: toNumber(rent),
    termType,
    startDate,
    endDate: termType === "fixed" && endDate ? endDate : null,
    rentDueDay: toNumber(dueDay),
    securityDeposit: toNumber(security),
    petDeposit: toNumber(pet),
    utilities: UTILITIES.map((name) => ({ utility: name.toLowerCase(), responsibility: utilities[name.toLowerCase()] })),
    charges: charges.map((c) => ({
      type: c.type,
      description: c.description.trim(),
      amount: toNumber(c.amount) ?? 0,
      frequency: c.frequency,
      startsOn: null,
      endsOn: null,
    })),
  };

  function updateCharge(index: number, change: Partial<ChargeRow>) {
    setCharges((rows) => rows.map((row, i) => (i === index ? { ...row, ...change } : row)));
  }

  return (
    <form
      action={embedded ? undefined : saveLeaseDetailsAction}
      onSubmit={async (event) => {
        // The province deposit limits are the law, so a form that breaks them is not sent.
        if (problems.length > 0) return event.preventDefault();
        if (!embedded) return;

        event.preventDefault();
        setSaving(true);
        setSaveError("");
        const answer = await saveLeaseDetailsInlineAction(details.id, payload);
        setSaving(false);
        if ("error" in answer) return answer.expired ? goToSessionExpired() : setSaveError(answer.error);
        embedded.onSaved(answer.details);
      }}
      className="space-y-4"
    >
      <input type="hidden" name="tenancyId" value={details.id} />
      <input type="hidden" name="payload" value={JSON.stringify(payload)} />

      {(error || saveError) && <p className="rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">{saveError || error}</p>}

      <section className="rounded-2xl border border-default bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-heading">Rent and term</h2>
        {/* Five across on the wide edit page; two across inside the narrower stepper card. */}
        <div className={`grid gap-4 sm:grid-cols-2 ${embedded ? "" : "xl:grid-cols-5"}`}>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="rent" className={labelClass}>Monthly rent ($)</label>
            <input id="rent" type="number" min="0" step="0.01" value={rent} onChange={(e) => setRent(e.target.value)} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="dueDay" className={labelClass}>Rent due day (1 to 28)</label>
            <input id="dueDay" type="number" min="1" max="28" value={dueDay} onChange={(e) => setDueDay(e.target.value)} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="termType" className={labelClass}>Term</label>
            <select id="termType" value={termType} onChange={(e) => setTermType(e.target.value as "fixed" | "month_to_month")} className={inputClass}>
              <option value="fixed">Fixed term</option>
              <option value="month_to_month">Month to month</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="startDate" className={labelClass}>Start date</label>
            <input id="startDate" type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} />
          </div>
          {termType === "fixed" && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="endDate" className={labelClass}>End date</label>
              <input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputClass} />
            </div>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-default bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-heading">Deposits</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="security" className={labelClass}>Security deposit ($)</label>
            <input id="security" type="number" min="0" step="0.01" value={security} onChange={(e) => setSecurity(e.target.value)} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="pet" className={labelClass}>Pet deposit ($)</label>
            <input id="pet" type="number" min="0" step="0.01" value={pet} onChange={(e) => setPet(e.target.value)} className={inputClass} />
          </div>
        </div>
        {rule.note && <p className="mt-3 rounded-lg bg-accent-tint px-3 py-2 text-xs text-accent-dark">{rule.note}</p>}
        {problems.map((problem) => (
          <p key={problem} className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{problem}</p>
        ))}
        {!rule.note && <p className="mt-3 text-xs text-muted">Deposit limits are only checked for Ontario and Manitoba. Check your province&apos;s rules.</p>}
      </section>

      <section className="rounded-2xl border border-default bg-white p-5 shadow-sm">
        <h2 className="mb-2 text-sm font-semibold text-heading">Who pays each utility</h2>
        <ul className="divide-y divide-default">
          {UTILITIES.map((name) => (
            <li key={name} className="flex items-center justify-between py-2.5 text-sm">
              <span className="text-heading">{name}</span>
              <select
                aria-label={`${name} responsibility`}
                value={utilities[name.toLowerCase()]}
                onChange={(e) => setUtilities((current) => ({ ...current, [name.toLowerCase()]: e.target.value }))}
                className="rounded-lg border border-default px-2.5 py-1.5 text-sm text-heading focus:border-accent focus:outline-none"
              >
                {RESPONSIBILITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-default bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-heading">Extra charges</h2>
          <button
            type="button"
            onClick={() => setCharges((rows) => [...rows, { type: "parking", description: "", amount: "", frequency: "monthly" }])}
            className="text-xs font-semibold text-accent hover:text-accent-dark"
          >
            + Add charge
          </button>
        </div>
        {charges.length === 0 && <p className="text-sm text-muted">No extra charges, such as parking or storage.</p>}
        <div className="space-y-3">
          {charges.map((row, index) => (
            <div key={index} className="grid gap-2 sm:grid-cols-[1fr_1.5fr_1fr_1fr_auto]">
              <select aria-label="Charge type" value={row.type} onChange={(e) => updateCharge(index, { type: e.target.value })} className={inputClass}>
                {CHARGE_TYPES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              <input aria-label="Description" placeholder="Stall 14" value={row.description} onChange={(e) => updateCharge(index, { description: e.target.value })} className={inputClass} />
              <input aria-label="Amount" type="number" min="0" step="0.01" placeholder="75.00" value={row.amount} onChange={(e) => updateCharge(index, { amount: e.target.value })} className={inputClass} />
              <select aria-label="How often" value={row.frequency} onChange={(e) => updateCharge(index, { frequency: e.target.value })} className={inputClass}>
                {CHARGE_FREQUENCIES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              <button type="button" onClick={() => setCharges((rows) => rows.filter((_, i) => i !== index))} className="text-xs font-semibold text-muted hover:text-heading">
                Remove
              </button>
            </div>
          ))}
        </div>
      </section>

      <div className="flex justify-end gap-3">
        {embedded ? (
          <button type="button" onClick={embedded.onCancel} className="rounded-full border border-default bg-white px-5 py-2.5 text-sm font-semibold text-heading hover:bg-subtle">
            Cancel
          </button>
        ) : (
          <Link href={`/landlord/tenancies/${details.id}`} className="rounded-full border border-default bg-white px-5 py-2.5 text-sm font-semibold text-heading hover:bg-subtle">
            Cancel
          </Link>
        )}
        <button type="submit" disabled={saving} className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-60">
          {saving ? "Saving…" : embedded ? "Save terms" : "Save lease details"}
        </button>
      </div>
    </form>
  );
}
