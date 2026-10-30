"use client";

// The Add lease stepper: Property and unit, Lease file, Lease terms, Review. Steps can be opened in any order, and the final button stays locked
// until every step is complete. Each step has a "What to do" guide beside it. Creating the lease uploads the PDF and makes the draft;
// the landlord then signs it and sends it to the tenants.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { LeaseTerms } from "@/components/lease-terms";
import { Stepper, type StepInfo } from "@/components/stepper";
import { StepLayout } from "@/components/step-layout";
import { createLeaseDocumentAction, leaseUploadUrlAction } from "@/lib/document-actions";
import { putToStorage } from "@/lib/document-format";
import type { PickerProperty } from "@/lib/lease-wizard-data";
import { goToSessionExpired } from "@/lib/session-expired-client";
import { loadTenancyDetailsAction } from "@/lib/tenancy-actions";
import type { TenancyDetails } from "@/lib/tenancy-types";

const MAX_BYTES = 10 * 1024 * 1024;
const inputClass = "w-full rounded-lg border border-default px-3 py-2.5 text-sm text-heading placeholder:text-muted focus:border-accent focus:outline-none";
const primaryButton = "rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400";
const ghostButton = "rounded-full border border-default bg-white px-5 py-2.5 text-sm font-semibold text-heading hover:bg-subtle disabled:cursor-not-allowed disabled:opacity-40";

// A selectable card: orange outline and tint when chosen.
function choiceClass(selected: boolean) {
  return `rounded-xl border-[1.5px] p-4 text-left transition ${selected ? "border-accent bg-accent-tint" : "border-default bg-white hover:border-accent"}`;
}

export function LeaseWizard({
  properties,
  initialUnitId,
  initialDetails,
}: {
  properties: PickerProperty[];
  // Set when the stepper opens from a lease's own page: the unit is already chosen and its details are loaded.
  initialUnitId?: number;
  initialDetails?: TenancyDetails;
}) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const startProperty = initialUnitId ? properties.find((p) => p.units.some((u) => u.id === initialUnitId)) : properties.length === 1 ? properties[0] : undefined;

  const [propertyId, setPropertyId] = useState<number | "">(startProperty?.id ?? "");
  const [unitId, setUnitId] = useState<number | "">(initialUnitId ?? "");
  const [details, setDetails] = useState<TenancyDetails | null>(initialDetails ?? null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  // Open on "Lease file" when the unit was already chosen.
  const [step, setStep] = useState(initialDetails ? 1 : 0);
  const [visited, setVisited] = useState<Record<number, boolean>>(initialDetails ? { 0: true, 1: true } : { 0: true });
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [title, setTitle] = useState("");
  const [titleEdited, setTitleEdited] = useState(false);
  const [matches, setMatches] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const property = properties.find((p) => p.id === propertyId);
  const unit = property?.units.find((u) => u.id === unitId);
  const shownTitle = titleEdited ? title : unit ? `Residential lease, ${unit.label}` : "";
  const region = property?.region ?? "";
  const isOntario = /^(on|ontario)$/i.test(region.trim());
  const isManitoba = /^(mb|manitoba)$/i.test(region.trim());

  const unitReady = Boolean(unit && unit.tenancyId && !unit.openDocumentId && details);
  const fileProblem =
    file && file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf") ? "The lease must be a PDF." : file && file.size > MAX_BYTES ? "The file is over 10 MB." : "";
  const fileReady = file !== null && !fileProblem && shownTitle.trim().length >= 2;
  const complete = [unitReady, fileReady, matches && unitReady, unitReady && fileReady && matches];
  const steps: StepInfo[] = ["Property and unit", "Lease file", "Lease terms", "Review"].map((label, index) => ({ label, complete: complete[index], visited: Boolean(visited[index]) }));
  const ready = complete[3];

  const missing: string[] = [];
  if (!unitReady) missing.push(unit && !unit.tenancyId ? "pick a unit that has a tenant" : "choose the property and unit");
  if (!file) missing.push("choose the lease PDF");
  else if (fileProblem) missing.push("fix the file");
  else if (shownTitle.trim().length < 2) missing.push("add a title");
  if (!matches) missing.push("confirm the terms match the PDF");

  function go(index: number) {
    setStep(index);
    setVisited((current) => ({ ...current, [index]: true }));
  }

  function chooseProperty(value: number) {
    setPropertyId(value);
    setUnitId("");
    setDetails(null);
    setMatches(false);
  }

  // The unit changed: load its lease details so the Lease terms step can show them.
  async function chooseUnit(value: number) {
    setUnitId(value);
    setDetails(null);
    setMatches(false);
    setError("");
    const chosen = property?.units.find((u) => u.id === value);
    if (!chosen?.tenancyId || chosen.openDocumentId) return;
    setLoadingDetails(true);
    const answer = await loadTenancyDetailsAction(chosen.tenancyId);
    setLoadingDetails(false);
    if ("error" in answer) return answer.expired ? goToSessionExpired() : setError(answer.error);
    setDetails(answer.details);
  }

  async function create() {
    if (!file || !details) return;
    setBusy(true);
    setError("");

    const target = await leaseUploadUrlAction(details.id);
    if ("error" in target) {
      setBusy(false);
      return target.expired ? goToSessionExpired() : setError(target.error);
    }
    try {
      await putToStorage(target.data.uploadUrl, file);
    } catch (err) {
      setBusy(false);
      return setError(err instanceof Error ? err.message : "The file could not be uploaded.");
    }

    const created = await createLeaseDocumentAction(details.id, shownTitle, target.data.blobPath, file.name);
    setBusy(false);
    if ("error" in created) return created.expired ? goToSessionExpired() : setError(created.error);
    router.push(`/landlord/documents/${created.data.documentId}`);
  }

  return (
    <div className="space-y-6">
      <Stepper steps={steps} current={step} onSelect={go} />

      {step === 0 && (
        <StepLayout
          icon="home"
          title="Where is this lease for?"
          intro="Pick the property, then the unit the tenants live in."
          guide={{
            steps: ["Choose the property.", "Choose the unit. A unit with a tenant name next to it is ready.", "Then press Next to upload the lease."],
            note: "A lease starts when a tenant accepts your invite. If a unit says “no tenant yet”, invite a tenant first and come back.",
          }}
        >
          <p className="mb-2 text-xs font-semibold text-heading">Property</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {properties.map((p) => (
              <button key={p.id} type="button" onClick={() => chooseProperty(p.id)} aria-pressed={p.id === propertyId} className={choiceClass(p.id === propertyId)}>
                <span className="block font-semibold text-heading">{p.name}</span>
                <span className="block text-xs text-muted">{p.address}</span>
                <span className="mt-2 block text-xs text-muted">{p.units.length} unit{p.units.length === 1 ? "" : "s"}</span>
              </button>
            ))}
          </div>

          {property && (
            <>
              <p className="mb-2 mt-6 text-xs font-semibold text-heading">Unit</p>
              {property.units.length === 0 ? (
                <p className="text-sm text-muted">This property has no units yet. Add a unit first.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {property.units.map((u) => (
                    <button key={u.id} type="button" onClick={() => chooseUnit(u.id)} aria-pressed={u.id === unitId} className={choiceClass(u.id === unitId)}>
                      <span className="block font-semibold text-heading">{u.label}</span>
                      <span className="mt-1 flex items-center gap-2 text-xs">
                        {u.openDocumentId ? (
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 font-semibold text-amber-700">Lease in progress</span>
                        ) : u.tenancyId ? (
                          <span className="rounded-full bg-green-50 px-2 py-0.5 font-semibold text-green-700">Has a tenant</span>
                        ) : (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 font-semibold text-gray-600">No tenant yet</span>
                        )}
                        {u.tenantName && <span className="text-muted">{u.tenantName}</span>}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {loadingDetails && <p className="mt-3 text-xs text-muted">Loading the lease details…</p>}
          {unit && !unit.tenancyId && (
            <div className="mt-4 rounded-xl bg-accent-tint px-4 py-3 text-sm text-accent-dark">
              <p className="font-semibold">This unit has no tenant yet.</p>
              <p className="mt-1">Invite a tenant to this unit, then come back to add the lease.</p>
              <Link href={`/landlord/tenants?unitId=${unit.id}`} className="mt-2 inline-block font-semibold text-accent hover:text-accent-dark">Invite a tenant to {unit.label}</Link>
            </div>
          )}
          {unit?.openDocumentId && (
            <div className="mt-4 rounded-xl bg-accent-tint px-4 py-3 text-sm text-accent-dark">
              <p className="font-semibold">This unit already has a lease in progress ({unit.openDocumentWord?.toLowerCase()}).</p>
              <Link href={`/landlord/documents/${unit.openDocumentId}`} className="mt-2 inline-block font-semibold text-accent hover:text-accent-dark">Continue that lease</Link>
            </div>
          )}
        </StepLayout>
      )}

      {step === 1 && (
        <StepLayout
          icon="file"
          title="Upload the lease"
          intro="Tenants will read exactly this file, so use the final version."
          guide={{
            steps: ["Have the finished lease ready as a PDF.", "Drop it in the box, or click the box to choose it.", "Check the title. You can change it."],
            note: isOntario
              ? "Ontario: the lease must be the Ontario Standard Lease form. The file can't be changed after it is sent."
              : isManitoba
                ? "Manitoba: attach the prescribed information the Residential Tenancies Branch requires. The file can't be changed after it is sent."
                : "The PDF must be readable, not password protected, up to 10 MB and 200 pages. It can't be changed after it is sent.",
          }}
        >
          <div
            onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => { event.preventDefault(); setDragging(false); setFile(event.dataTransfer.files?.[0] ?? null); }}
            onClick={() => fileInput.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") fileInput.current?.click(); }}
            className={`flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed px-4 py-10 text-center transition ${dragging || file ? "border-accent bg-accent-tint" : "border-slate-300 bg-slate-50 hover:border-accent"}`}
          >
            <svg className="h-9 w-9 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span className="mt-3 text-sm font-semibold text-heading">{file ? file.name : "Drop the lease PDF here"}</span>
            <span className="mt-1 text-xs text-muted">{file ? `${(file.size / 1024 / 1024).toFixed(1)} MB · click to choose a different file` : "or click to choose a file"}</span>
            <input ref={fileInput} type="file" accept=".pdf,application/pdf" className="sr-only" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
          </div>
          {fileProblem && <p className="mt-2 text-xs font-medium text-red-700">{fileProblem}</p>}
          {file && !fileProblem && (
            <button type="button" onClick={() => { setFile(null); if (fileInput.current) fileInput.current.value = ""; }} className="mt-2 text-xs font-semibold text-muted hover:text-heading">
              Remove the file
            </button>
          )}

          <div className="mt-5">
            <label htmlFor="title" className="mb-1 block text-xs font-semibold text-heading">Title</label>
            <input id="title" value={shownTitle} onChange={(event) => { setTitle(event.target.value); setTitleEdited(true); }} maxLength={120} className={inputClass} placeholder="Residential lease, Unit 2B" />
          </div>
        </StepLayout>
      )}

      {step === 2 && (
        <StepLayout
          icon="list"
          title="Check the lease terms"
          intro="These are the terms you saved for this lease. They must match the PDF."
          guide={{
            steps: ["Compare the rent, due day, term, deposit and utilities with the PDF.", "If something is wrong, use Edit lease details, fix it and come back.", "Tick the box when they match."],
            note: "The terms are saved with the lease when you send it, as a record of what was agreed.",
          }}
        >
          {details ? (
            <div className="space-y-4">
              <LeaseTerms details={details} />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-heading">
                  <input type="checkbox" checked={matches} onChange={(event) => setMatches(event.target.checked)} /> The terms above match the lease PDF
                </label>
                <Link href={`/landlord/tenancies/${details.id}/edit`} className="text-sm font-semibold text-accent hover:text-accent-dark">Edit lease details</Link>
              </div>
            </div>
          ) : (
            <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-muted">Choose the property and unit first. The lease terms show up here.</p>
          )}
        </StepLayout>
      )}

      {step === 3 && (
        <StepLayout
          icon="check"
          title="Review and add"
          intro="One last look before the lease is created."
          guide={{
            steps: ["Check each line below. Use Change to fix one.", "Press Add lease and continue.", "Next you sign the lease yourself, then send it to your tenants."],
            note: "Once sent, the file can't be changed. To change it, withdraw the lease and send a new version.",
          }}
        >
          <ul className="divide-y divide-default text-sm">
            {[
              { label: "Unit", value: property && unit ? `${property.name} · ${unit.label}` : "", ok: unitReady, at: 0 },
              { label: "Lease file", value: file ? `${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)` : "", ok: file !== null && !fileProblem, at: 1 },
              { label: "Title", value: shownTitle, ok: shownTitle.trim().length >= 2, at: 1 },
              { label: "Terms match the PDF", value: matches ? "Confirmed" : "", ok: matches, at: 2 },
              { label: "Tenants who will sign", value: details ? details.tenants.filter((t) => !t.leftAt).map((t) => t.name ?? "Tenant").join(", ") : "", ok: Boolean(details), at: 0 },
            ].map((row) => (
              <li key={row.label} className="flex items-center gap-3 py-3">
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${row.ok ? "bg-accent text-white" : "border-2 border-accent text-accent"}`}>{row.ok ? "✓" : "!"}</span>
                <span className="w-44 shrink-0 text-muted">{row.label}</span>
                <span className="min-w-0 flex-1 truncate font-medium text-heading">{row.value || "Not done yet"}</span>
                <button type="button" onClick={() => go(row.at)} className="text-xs font-semibold text-accent hover:text-accent-dark">Change</button>
              </li>
            ))}
          </ul>
        </StepLayout>
      )}

      {error && <p className="rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">{error}</p>}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-default pt-4">
        <p className="text-xs">
          {ready ? <span className="font-semibold text-green-700">Ready to add</span> : <span className="text-accent-dark"><b>Still needed:</b> {missing.join(", ")}</span>}
        </p>
        <div className="flex gap-2">
          <button type="button" onClick={() => go(Math.max(0, step - 1))} disabled={step === 0} className={ghostButton}>Back</button>
          <button type="button" onClick={() => go(Math.min(3, step + 1))} disabled={step === 3} className={ghostButton}>Next</button>
          <button type="button" onClick={create} disabled={!ready || busy} className={primaryButton}>{busy ? "Uploading…" : "Add lease and continue"}</button>
        </div>
      </div>
    </div>
  );
}
