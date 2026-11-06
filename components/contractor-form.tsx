"use client";

// The add and edit form for one contractor: name, company, trades (with a preferred tick for each), phone, email, how they get jobs, and
// private notes. A contractor who is already in the app keeps that; nobody can be put in the app from this form (they accept an invitation).
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChoiceChips } from "@/components/choice-chips";
import { useRunner } from "@/components/maintenance-request-actions";
import { createContractorAction, deleteContractorAction, updateContractorAction } from "@/lib/contractor-actions";
import type { ContractorDetail, ContractorInput } from "@/lib/contractor-types";
import { CATEGORIES } from "@/lib/maintenance-format";
import { goToSessionExpired } from "@/lib/session-expired-client";

const inputClass = "w-full rounded-lg border border-default px-3 py-2.5 text-sm text-heading placeholder:text-muted focus:border-accent focus:outline-none";
const labelClass = "mb-1.5 block text-sm font-semibold text-heading";
const cardClass = "rounded-2xl border border-default bg-white p-5 shadow-sm";
const primaryButton = "rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50";
const ghostButton = "rounded-full border border-default bg-white px-4 py-2 text-sm font-semibold text-heading hover:bg-subtle disabled:cursor-not-allowed disabled:opacity-50";

export function ContractorForm({ contractor }: { contractor?: ContractorDetail }) {
  const router = useRouter();
  const inApp = contractor?.howTheyWork === "InTheApp";
  const [name, setName] = useState(contractor?.name ?? "");
  const [company, setCompany] = useState(contractor?.companyName ?? "");
  const [trades, setTrades] = useState<string[]>(contractor?.trades.map((trade) => trade.category) ?? []);
  const [preferred, setPreferred] = useState<string[]>(contractor?.trades.filter((trade) => trade.isPreferred).map((trade) => trade.category) ?? []);
  const [phone, setPhone] = useState(contractor?.phone ?? "");
  const [email, setEmail] = useState(contractor?.email ?? "");
  const [how, setHow] = useState<"EmailLink" | "PhoneOnly">(contractor && !inApp ? (contractor.howTheyWork as "EmailLink" | "PhoneOnly") : "EmailLink");
  const [notes, setNotes] = useState(contractor?.notes ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const remove = useRunner();

  // Picking a trade adds it; picking it again removes it (and its preferred tick).
  function toggleTrade(trade: string) {
    const on = trades.includes(trade);
    setTrades(on ? trades.filter((item) => item !== trade) : [...trades, trade]);
    if (on) setPreferred(preferred.filter((item) => item !== trade));
  }

  async function save() {
    setError("");
    if (!name.trim()) return setError("Enter the contractor's name.");
    if (trades.length === 0) return setError("Pick at least one trade.");
    if (!phone.trim()) return setError("Enter a phone number.");
    if (!inApp && how === "EmailLink" && !email.trim()) return setError("The email link needs an email address. Enter one, or choose Phone only.");

    const input: ContractorInput = {
      name: name.trim(),
      companyName: company.trim() || null,
      trades,
      preferredTrades: preferred,
      phone: phone.trim(),
      email: email.trim() || null,
      howTheyWork: inApp ? "InTheApp" : how,
      notes: notes.trim() || null,
    };
    setBusy(true);
    const result = contractor ? await updateContractorAction(contractor.id, input) : await createContractorAction(input);
    setBusy(false);
    if ("ok" in result) router.push("/landlord/maintenance/contractors");
    else if (result.expired) goToSessionExpired();
    else setError(result.error);
  }

  async function deleteIt() {
    if (!contractor || !window.confirm("Delete this contractor? This cannot be undone.")) return;
    if (await remove.run(() => deleteContractorAction(contractor.id))) router.push("/landlord/maintenance/contractors");
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className={cardClass}>
        <label htmlFor="name" className={labelClass}>Name *</label>
        <input id="name" value={name} onChange={(event) => setName(event.target.value)} className={inputClass} />

        <label htmlFor="company" className={`${labelClass} mt-4`}>Company <span className="font-normal text-muted">(optional)</span></label>
        <input id="company" value={company} onChange={(event) => setCompany(event.target.value)} className={inputClass} />

        <span className={`${labelClass} mt-4`}>Trades * <span className="font-normal text-muted">pick every trade they do</span></span>
        <ChoiceChips label="Trades" options={CATEGORIES} selected={trades} onToggle={toggleTrade} />
        {trades.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {trades.map((trade) => (
              <label key={trade} className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={preferred.includes(trade)}
                  onChange={(event) => setPreferred(event.target.checked ? [...preferred, trade] : preferred.filter((item) => item !== trade))}
                  className="mt-1"
                />
                <span>
                  <span className="font-semibold text-heading">Preferred for {trade}</span>
                  <span className="block text-xs text-muted">Suggested first when you assign a {trade.toLowerCase()} job or ask for quotes.</span>
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className={cardClass}>
        <label htmlFor="phone" className={labelClass}>Phone *</label>
        <input id="phone" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="(204) 555-0144" className={inputClass} />

        <label htmlFor="email" className={`${labelClass} mt-4`}>Email <span className="font-normal text-muted">(needed for the email link and the invitation)</span></label>
        <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className={inputClass} />

        <span className={`${labelClass} mt-4`}>How will they get jobs?</span>
        {inApp ? (
          <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
            In the app{contractor?.linkedAccountName ? `, as ${contractor.linkedAccountName}` : ""}. They answer jobs and quotes themselves.
          </p>
        ) : (
          <div className="space-y-2">
            {([
              { value: "EmailLink", title: "Email link", note: "A secure link for each job or quote. Needs an email." },
              { value: "PhoneOnly", title: "Phone only", note: "You phone them and enter their answers yourself." },
            ] as const).map((option) => (
              <label key={option.value} className="flex cursor-pointer items-start gap-2 text-sm">
                <input type="radio" name="how" checked={how === option.value} onChange={() => setHow(option.value)} className="mt-1" />
                <span>
                  <span className="font-semibold text-heading">{option.title}</span>
                  <span className="block text-xs text-muted">{option.note}</span>
                </span>
              </label>
            ))}
            <p className="text-xs text-muted">To put them in the app, save first and use Invite to DomusPRO on the list.</p>
          </div>
        )}

        <label htmlFor="notes" className={`${labelClass} mt-4`}>Notes <span className="font-normal text-muted">(only you see them)</span></label>
        <textarea id="notes" rows={2} value={notes} onChange={(event) => setNotes(event.target.value)} className={inputClass} />
      </div>

      {(error || remove.error) && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">{error || remove.error}</p>}

      <div className="flex items-center justify-between gap-2">
        <div>
          {contractor?.canDelete && (
            <button type="button" disabled={busy || remove.busy} onClick={deleteIt} className="rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">
              Delete
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <Link href="/landlord/maintenance/contractors" className={ghostButton}>Cancel</Link>
          <button type="button" disabled={busy} onClick={save} className={primaryButton}>{busy ? "Saving…" : "Save"}</button>
        </div>
      </div>
    </div>
  );
}
