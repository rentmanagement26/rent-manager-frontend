"use client";

// Landlord step 1 of sending a lease: pick the PDF, check the terms match it, then create the draft.
// The draft is signed by the landlord next, then sent to the tenants from the document page.
import { useRouter } from "next/navigation";
import { goToSessionExpired } from "@/lib/session-expired-client";
import { useState } from "react";
import { LeaseTerms } from "@/components/lease-terms";
import { Stepper, type StepInfo } from "@/components/stepper";
import { createLeaseDocumentAction, leaseUploadUrlAction } from "@/lib/document-actions";
import { putToStorage } from "@/lib/document-format";
import type { TenancyDetails } from "@/lib/tenancy-types";

const MAX_BYTES = 10 * 1024 * 1024;
const inputClass = "w-full rounded-lg border border-default px-3 py-2.5 text-sm text-heading placeholder:text-muted focus:border-accent focus:outline-none";
const primaryButton = "rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400";
const ghostButton = "rounded-full border border-default bg-white px-5 py-2.5 text-sm font-semibold text-heading hover:bg-subtle disabled:cursor-not-allowed disabled:opacity-40";

export function PrepareLease({ details, region, defaultTitle }: { details: TenancyDetails; region: string; defaultTitle: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [visited, setVisited] = useState<Record<number, boolean>>({ 0: true });
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState(defaultTitle);
  const [matches, setMatches] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const fileProblem = file && file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf") ? "The lease must be a PDF." : file && file.size > MAX_BYTES ? "The file is over 10 MB." : "";
  const complete = [file !== null && !fileProblem && title.trim().length >= 2, matches, file !== null && !fileProblem && title.trim().length >= 2 && matches];
  const steps: StepInfo[] = ["Lease file", "Lease terms", "Review"].map((label, index) => ({ label, complete: complete[index], visited: Boolean(visited[index]) }));
  const ready = complete[2];

  const missing: string[] = [];
  if (!file) missing.push("choose the lease PDF");
  else if (fileProblem) missing.push("fix the file");
  if (title.trim().length < 2) missing.push("add a title");
  if (!matches) missing.push("confirm the terms match the PDF");

  function go(index: number) {
    setStep(index);
    setVisited((current) => ({ ...current, [index]: true }));
  }

  async function create() {
    if (!file) return;
    setBusy(true);
    setError("");

    const target = await leaseUploadUrlAction(details.id);
    if ("error" in target) {
      setBusy(false);
      return target.expired ? (goToSessionExpired()) : setError(target.error);
    }
    try {
      await putToStorage(target.data.uploadUrl, file);
    } catch (err) {
      setBusy(false);
      return setError(err instanceof Error ? err.message : "The file could not be uploaded.");
    }

    const created = await createLeaseDocumentAction(details.id, title, target.data.blobPath, file.name);
    setBusy(false);
    if ("error" in created) return created.expired ? (goToSessionExpired()) : setError(created.error);
    router.push(`/landlord/documents/${created.data.documentId}`);
  }

  const lawNote = /^(on|ontario)$/i.test(region.trim())
    ? "Ontario: the lease must be the Ontario Standard Lease form."
    : /^(mb|manitoba)$/i.test(region.trim())
      ? "Manitoba: attach the prescribed information the Residential Tenancies Branch requires."
      : "";

  return (
    <div className="space-y-6">
      <Stepper steps={steps} current={step} onSelect={go} />

      <div className="min-h-[200px]">
        {step === 0 && (
          <section className="rounded-2xl border border-default bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-heading">Lease file</h2>
            <p className="mt-1 text-sm text-muted">Choose the lease as a PDF (up to 10 MB and 200 pages). Tenants will read exactly this file.</p>
            <label className="mt-4 flex cursor-pointer flex-col items-center rounded-xl border-[1.5px] border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center hover:border-accent">
              <span className="text-sm font-semibold text-heading">{file ? file.name : "Choose the PDF"}</span>
              <span className="mt-1 text-xs text-muted">{file ? `${(file.size / 1024 / 1024).toFixed(1)} MB · click to replace` : "PDF only, readable and not password protected"}</span>
              <input type="file" accept=".pdf,application/pdf" className="sr-only" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
            </label>
            {fileProblem && <p className="mt-2 text-xs font-medium text-red-700">{fileProblem}</p>}
            <div className="mt-4">
              <label htmlFor="title" className="mb-1 block text-xs font-semibold text-heading">Title</label>
              <input id="title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} className={inputClass} />
            </div>
            {lawNote && <p className="mt-4 rounded-lg bg-accent-tint px-3 py-2 text-xs text-accent-dark">{lawNote}</p>}
          </section>
        )}

        {step === 1 && (
          <section className="space-y-4">
            <p className="text-sm text-muted">These come from your lease details. Check they match the PDF. The terms are saved with the document when you send it.</p>
            <LeaseTerms details={details} />
            <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-heading">
              <input type="checkbox" checked={matches} onChange={(event) => setMatches(event.target.checked)} /> The terms above match the lease PDF
            </label>
          </section>
        )}

        {step === 2 && (
          <section className="rounded-2xl border border-default bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-heading">Review</h2>
            <dl className="mt-3 divide-y divide-default text-sm">
              <div className="flex justify-between py-2"><dt className="text-muted">File</dt><dd className="font-medium text-heading">{file?.name ?? "Not chosen"}</dd></div>
              <div className="flex justify-between py-2"><dt className="text-muted">Title</dt><dd className="font-medium text-heading">{title || "Not set"}</dd></div>
              <div className="flex justify-between py-2"><dt className="text-muted">Terms</dt><dd className="font-medium text-heading">{matches ? "Confirmed" : "Not confirmed"}</dd></div>
              <div className="flex justify-between py-2"><dt className="text-muted">Tenants who will sign</dt><dd className="font-medium text-heading">{details.tenants.filter((t) => !t.leftAt).map((t) => t.name ?? "Tenant").join(", ")}</dd></div>
            </dl>
            <p className="mt-3 text-xs text-muted">Next you sign the lease yourself, then send it to your tenants. A sent lease can&apos;t be changed: withdraw it and send a new version instead.</p>
          </section>
        )}
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">{error}</p>}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-default pt-4">
        <p className="text-xs">
          {ready ? <span className="font-semibold text-green-700">Ready to create</span> : <span className="text-accent-dark"><b>Still needed:</b> {missing.join(", ")}</span>}
        </p>
        <div className="flex gap-2">
          <button type="button" onClick={() => go(Math.max(0, step - 1))} disabled={step === 0} className={ghostButton}>Back</button>
          <button type="button" onClick={() => go(Math.min(2, step + 1))} disabled={step === 2} className={ghostButton}>Next</button>
          <button type="button" onClick={create} disabled={!ready || busy} className={primaryButton}>{busy ? "Uploading…" : "Create lease and continue"}</button>
        </div>
      </div>
    </div>
  );
}
