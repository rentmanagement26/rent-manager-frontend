"use client";

// The landlord's maintenance settings: the emergency phone a tenant is shown when they report an emergency, and the contact a contractor sees
// on a job. An empty box clears the saved value; with no contractor contact, contractors see the landlord's own name and phone.
import { useState } from "react";
import { saveSettingsAction } from "@/lib/landlord-maintenance-actions";
import type { MaintenanceSettings } from "@/lib/landlord-maintenance-types";
import { goToSessionExpired } from "@/lib/session-expired-client";

const inputClass = "w-full max-w-sm rounded-lg border border-default px-3 py-2.5 text-sm text-heading placeholder:text-muted focus:border-accent focus:outline-none";
const cardClass = "rounded-2xl border border-default bg-white p-5 shadow-sm";

export function MaintenanceSettingsForm({ settings }: { settings: MaintenanceSettings }) {
  const [emergencyPhone, setEmergencyPhone] = useState(settings.emergencyPhone ?? "");
  const [contactName, setContactName] = useState(settings.contractorContactName ?? "");
  const [contactPhone, setContactPhone] = useState(settings.contractorContactPhone ?? "");
  const [seen, setSeen] = useState(settings.contractorSees);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function save() {
    setBusy(true);
    setError("");
    setSaved(false);
    const result = await saveSettingsAction(emergencyPhone, contactName, contactPhone);
    setBusy(false);
    if ("ok" in result) {
      setSeen(result.data.contractorSees);
      setSaved(true);
    } else if (result.expired) goToSessionExpired();
    else setError(result.error);
  }

  return (
    <div className="grid max-w-5xl gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <div className="space-y-4">
        <section className={cardClass}>
          <h2 className="font-head text-lg font-bold text-heading">Emergency phone</h2>
          <p className="mb-3 mt-1 text-sm text-muted">
            Shown to a tenant who chooses Emergency, next to &quot;If anyone is in danger, call 911&quot;. Optional: if empty, tenants are only told you were notified.
          </p>
          <input aria-label="Emergency phone" value={emergencyPhone} onChange={(event) => setEmergencyPhone(event.target.value)} placeholder="(204) 555-0142" className={inputClass} />
        </section>

        <section className={cardClass}>
          <h2 className="font-head text-lg font-bold text-heading">Contact for contractors</h2>
          <p className="mb-3 mt-1 text-sm text-muted">Shown on a contractor&apos;s job so they can ask an urgent question. It does not have to be your personal number.</p>
          <label htmlFor="contact-name" className="mb-1.5 block text-sm font-medium text-heading">Name <span className="font-normal text-muted">(optional)</span></label>
          <input id="contact-name" value={contactName} onChange={(event) => setContactName(event.target.value)} className={inputClass} />
          <label htmlFor="contact-phone" className="mb-1.5 mt-3 block text-sm font-medium text-heading">Phone</label>
          <input id="contact-phone" value={contactPhone} onChange={(event) => setContactPhone(event.target.value)} placeholder="(204) 555-0100" className={inputClass} />
        </section>

        {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">{error}</p>}
        {saved && <p role="status" className="rounded-lg bg-green-50 px-3 py-2.5 text-sm font-medium text-green-800">Settings saved.</p>}
        <button type="button" disabled={busy} onClick={save} className="rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-50">
          {busy ? "Saving…" : "Save"}
        </button>
      </div>

      <aside className="space-y-4">
        <section className={cardClass}>
          <h2 className="font-head text-lg font-bold text-heading">What a tenant sees</h2>
          <p className="mt-1 text-sm text-muted">When Emergency is chosen on the report form.</p>
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">If anyone is in danger, call 911 first.</p>
          <p className="mt-2 rounded-lg bg-brand-green-tint px-3 py-2 text-sm text-brand-green-dark">
            Your landlord has been notified.{emergencyPhone.trim() && <> For an emergency you can also call <span className="font-semibold">{emergencyPhone.trim()}</span>.</>}
          </p>
        </section>
        <section className={cardClass}>
          <h2 className="font-head text-lg font-bold text-heading">What a contractor sees</h2>
          <p className="mt-1 text-sm text-muted">At the bottom of a job.</p>
          <p className="mt-3 rounded-lg bg-bg px-3 py-2 text-sm text-heading">
            Questions about this job: <span className="font-semibold">{[seen.name, seen.phone].filter(Boolean).join(" ")}</span>
          </p>
          {seen.isFallback && <p className="mt-2 text-xs text-muted">This is your own account name and phone, because no contractor contact is saved.</p>}
          {!seen.phone && <p className="mt-2 text-xs font-medium text-amber-800">Your account has no phone number, so contractors would see no number. Save a contractor contact with a phone.</p>}
        </section>
      </aside>
    </div>
  );
}
