"use client";

// The signing flow for one lease, used by the landlord (who signs first) and by each tenant.
// Four steps that can be opened in any order: Read lease, Agree, Sign, Confirm. The final button stays locked until every
// step that applies is complete. Signing on paper skips the online-only steps and ends with uploading the signed scan.
import { useRef, useState } from "react";
import Link from "next/link";
import { DocumentViewer } from "@/components/document-viewer";
import { SignaturePad } from "@/components/signature-pad";
import { Stepper, type StepInfo } from "@/components/stepper";
import {
  declineDocumentAction,
  landlordPaperUploadUrlAction,
  landlordSignPaperAction,
  printCopyAction,
  recordPagesViewedAction,
  sendSigningCodeAction,
  signOnlineAction,
  tenantPaperUploadUrlAction,
  uploadSignedCopyAction,
  verifySigningCodeAction,
} from "@/lib/document-actions";
import { putToStorage } from "@/lib/document-format";
import { goToSessionExpired as expire } from "@/lib/session-expired-client";
import type { LeaseDocument, SignatureDrawing, SigningStatus } from "@/lib/document-types";

type Mode = "draw" | "type" | "paper";

// The storage emulator used in development serves http on localhost; everything else must be https.
function downloadIsLocal(url: string) {
  return /^http:\/\/(localhost|127\.0\.0\.1)(:|\/)/i.test(url);
}

const inputClass = "w-full rounded-lg border border-default px-3 py-2.5 text-sm text-heading placeholder:text-muted focus:border-accent focus:outline-none";
const primaryButton = "rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400";
const ghostButton = "rounded-full border border-default bg-white px-5 py-2.5 text-sm font-semibold text-heading hover:bg-subtle disabled:cursor-not-allowed disabled:opacity-40";


export function SigningFlow({
  document: doc,
  status,
  role,
  doneHref,
}: {
  document: LeaseDocument;
  status: SigningStatus;
  role: "landlord" | "tenant";
  // Where "Back" goes after signing.
  doneHref: string;
}) {
  const fileUrl = `/api/documents/${doc.id}/file`;
  const onlineOk = status.available;
  const otherTenants = doc.signers.filter((s) => s.role === "Tenant" && s.status === "Pending" && s.displayName);

  const [step, setStep] = useState(0);
  const [visited, setVisited] = useState<Record<number, boolean>>({ 0: true });
  const [mode, setMode] = useState<Mode | "">(onlineOk ? "" : "paper");
  const [seen, setSeen] = useState<Set<number>>(new Set());
  const [viewed, setViewed] = useState(status.pagesViewed);
  const [allViewed, setAllViewed] = useState(status.allPagesViewed || !status.pagesRequired);
  const [agree, setAgree] = useState(false);
  const [given, setGiven] = useState("");
  const [surname, setSurname] = useState("");
  const [drawing, setDrawing] = useState<SignatureDrawing | null>(null);
  const [codeSentTo, setCodeSentTo] = useState("");
  const [code, setCode] = useState("");
  const [verified, setVerified] = useState(status.codeVerified);
  const [file, setFile] = useState<File | null>(null);
  const [confirmedCopy, setConfirmedCopy] = useState(false);
  const [alsoCovers, setAlsoCovers] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<"" | "online" | "paper" | "declined">("");
  const [declining, setDeclining] = useState(false);
  const [declineNote, setDeclineNote] = useState("");
  const reported = useRef<Set<number>>(new Set());

  const paper = mode === "paper";

  // Which steps are complete. Paper has no pages-viewed, consent or email-code rules, only the signed scan.
  const complete = [
    paper || allViewed,
    paper || agree,
    paper
      ? file !== null && confirmedCopy
      : mode !== "" && given.trim() !== "" && surname.trim() !== "" && (mode !== "draw" || drawing !== null),
    paper || verified,
  ];
  // Signing on paper needs no reading check, consent or email code, so those steps say "Not needed" instead of looking finished.
  const steps: StepInfo[] = ["Read lease", "Agree", "Sign", "Confirm"].map((label, index) => ({
    label,
    complete: complete[index],
    visited: Boolean(visited[index]),
    skipped: paper && index !== 2,
  }));
  const allComplete = complete.every(Boolean);

  const missing: string[] = [];
  if (!complete[0]) missing.push(`view ${Math.max(0, status.pageCount - viewed)} more page${status.pageCount - viewed === 1 ? "" : "s"}`);
  if (!complete[1]) missing.push("agree to sign electronically");
  if (!complete[2]) missing.push(mode === "" ? "choose how to sign" : paper ? "choose your signed scan and confirm it" : drawing === null && mode === "draw" && given && surname ? "draw your signature" : "enter your names");
  if (!complete[3]) missing.push(codeSentTo ? "verify the email code" : "request the email code");

  function go(index: number) {
    setStep(index);
    setVisited((current) => ({ ...current, [index]: true }));
  }

  // A page was drawn in the viewer: remember it and tell the backend once.
  function pageSeen(page: number) {
    setSeen((current) => (current.has(page) ? current : new Set(current).add(page)));
    if (reported.current.has(page) || paper) return;
    reported.current.add(page);
    recordPagesViewedAction(doc.id, [page]).then((answer) => {
      if ("error" in answer) {
        if (answer.expired) expire();
        reported.current.delete(page);
        return;
      }
      setViewed(answer.data.viewed);
      setAllViewed(answer.data.allViewed);
    });
  }

  async function requestCode() {
    setBusy(true);
    setError("");
    const answer = await sendSigningCodeAction(doc.id);
    setBusy(false);
    if ("error" in answer) return answer.expired ? expire() : setError(answer.error);
    setCodeSentTo(answer.data.sentTo);
  }

  async function checkCode() {
    setBusy(true);
    setError("");
    const answer = await verifySigningCodeAction(doc.id, code);
    setBusy(false);
    if ("error" in answer) return answer.expired ? expire() : setError(answer.error);
    setVerified(true);
  }

  async function openPrintCopy() {
    setError("");
    const answer = await printCopyAction(doc.id);
    if ("error" in answer) return answer.expired ? expire() : setError(answer.error);
    if (!/^https:\/\//i.test(answer.data.downloadUrl) && !downloadIsLocal(answer.data.downloadUrl)) return setError("The download address was not valid.");
    window.open(answer.data.downloadUrl, "_blank", "noopener,noreferrer");
  }

  async function submit() {
    setBusy(true);
    setError("");

    if (paper) {
      const extension = (file!.name.split(".").pop() ?? "pdf").toLowerCase();
      const target = role === "landlord" ? await landlordPaperUploadUrlAction(doc.id, extension) : await tenantPaperUploadUrlAction(doc.id, extension);
      if ("error" in target) {
        setBusy(false);
        return target.expired ? expire() : setError(target.error);
      }
      try {
        await putToStorage(target.data.uploadUrl, file!);
      } catch (err) {
        setBusy(false);
        return setError(err instanceof Error ? err.message : "The file could not be uploaded.");
      }
      const registered =
        role === "landlord"
          ? await landlordSignPaperAction(doc.id, target.data.blobPath, file!.name)
          : await uploadSignedCopyAction(doc.id, target.data.blobPath, file!.name, alsoCovers);
      setBusy(false);
      if ("error" in registered) return registered.expired ? expire() : setError(registered.error);
      return setResult("paper");
    }

    const signed = await signOnlineAction(doc.id, {
      version: status.version,
      consentVersion: status.consentVersion,
      givenNames: given.trim(),
      surname: surname.trim(),
      signature: mode === "draw" ? drawing : null,
    });
    setBusy(false);
    if ("error" in signed) return signed.expired ? expire() : setError(signed.error);
    setResult("online");
  }

  async function decline() {
    setBusy(true);
    const answer = await declineDocumentAction(doc.id, declineNote);
    setBusy(false);
    if ("error" in answer) return answer.expired ? expire() : setError(answer.error);
    setResult("declined");
  }

  // --- Finished ---
  if (result) {
    const text =
      result === "declined"
        ? { title: "You declined this lease", body: "Your landlord has been told." }
        : result === "paper"
          ? role === "landlord"
            ? { title: "Your signed copy is in", body: "Now send the lease to your tenants from the lease page." }
            : { title: "Signed copy uploaded", body: "Your landlord will check it. You will be told if it needs to be scanned again." }
          : role === "landlord"
            ? { title: "You have signed the lease", body: "Now send it to your tenants from the lease page." }
            : { title: "You have signed the lease", body: "Your landlord and the other tenants are told. A final signed copy is sent when everyone has signed." };
    return (
      <div className="rounded-2xl border border-default bg-white p-8 text-center shadow-sm">
        <h2 className="font-head text-xl font-bold text-accent">{text.title}</h2>
        <p className="mt-2 text-sm text-muted">{text.body}</p>
        <Link href={doneHref} className={`${primaryButton} mt-6 inline-block`}>
          Back to the lease
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Stepper steps={steps} current={step} onSelect={go} />

      <div className="min-h-[200px]">
        {step === 0 && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="h-1.5 w-48 rounded-full bg-slate-200">
                <div className="h-1.5 rounded-full bg-accent" style={{ width: `${status.pageCount ? Math.min(100, (viewed / status.pageCount) * 100) : 0}%` }} />
              </div>
              <span className="text-xs text-muted">
                {viewed} of {status.pageCount} pages viewed
              </span>
            </div>
            <DocumentViewer fileUrl={fileUrl} downloadUrl={`${fileUrl}?download=1`} title={doc.title} seenPages={seen} onPageSeen={pageSeen} />
          </div>
        )}

        {step === 1 && (
          <section className="rounded-2xl border border-default bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-heading">Agree to sign electronically</h2>
            <p className="mt-2 text-sm text-body">{status.consentText}</p>
            {paper && <p className="mt-3 text-xs text-muted">You chose to sign on paper, so this is not needed.</p>}
            <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm font-semibold text-heading">
              <input type="checkbox" checked={agree} onChange={(event) => setAgree(event.target.checked)} /> I agree
            </label>
          </section>
        )}

        {step === 2 && (
          <section className="rounded-2xl border border-default bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-heading">How do you want to sign?</h2>
            {!onlineOk && status.message && <p className="mt-2 rounded-lg bg-accent-tint px-3 py-2 text-xs text-accent-dark">{status.message}</p>}
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {([
                ["draw", "Draw your signature", "Draw it, with your typed name"],
                ["type", "Type your name", "Your typed legal name counts as your signature"],
                ["paper", "Sign on paper", "Download, sign by hand, upload a scan"],
              ] as const).map(([value, title, note]) => {
                const disabled = value !== "paper" && !onlineOk;
                return (
                  <button
                    key={value}
                    type="button"
                    disabled={disabled}
                    onClick={() => setMode(value)}
                    className={`rounded-xl border-[1.5px] p-3 text-left disabled:cursor-not-allowed disabled:opacity-40 ${mode === value ? "border-accent bg-accent-tint" : "border-default bg-white hover:border-accent"}`}
                  >
                    <span className="block text-sm font-semibold text-heading">{title}</span>
                    <span className="mt-0.5 block text-xs text-muted">{note}</span>
                  </button>
                );
              })}
            </div>

            {(mode === "draw" || mode === "type") && (
              <div className="mt-4 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="given" className="mb-1 block text-xs font-semibold text-heading">Given names</label>
                    <input id="given" value={given} onChange={(event) => setGiven(event.target.value)} className={inputClass} autoComplete="given-name" />
                  </div>
                  <div>
                    <label htmlFor="surname" className="mb-1 block text-xs font-semibold text-heading">Surname</label>
                    <input id="surname" value={surname} onChange={(event) => setSurname(event.target.value)} className={inputClass} autoComplete="family-name" />
                  </div>
                </div>
                <p className="text-xs text-muted">Your name must match the name on your DomusPRO account.</p>
                {mode === "draw" && <SignaturePad value={drawing} onChange={setDrawing} />}
              </div>
            )}

            {mode === "paper" && (
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-default pt-3">
                  <span>1. Download the print copy and sign every page</span>
                  <button type="button" onClick={openPrintCopy} className={ghostButton}>Download print copy</button>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-default pt-3">
                  <span>2. Upload your signed scan or photos</span>
                  <input type="file" accept={role === "landlord" ? ".pdf" : ".pdf,.jpg,.jpeg,.png"} onChange={(event) => setFile(event.target.files?.[0] ?? null)} className="max-w-[16rem] text-xs" />
                </div>
                {role === "tenant" && otherTenants.length > 1 && (
                  <fieldset className="border-t border-default pt-3">
                    <legend className="mb-1 text-xs font-semibold text-heading">This scan also covers</legend>
                    {otherTenants.filter((s) => s.displayName !== "").map((signer) => (
                      <label key={signer.id} className="mr-4 inline-flex items-center gap-1.5 text-xs">
                        <input
                          type="checkbox"
                          checked={alsoCovers.includes(signer.id)}
                          onChange={(event) => setAlsoCovers((current) => (event.target.checked ? [...current, signer.id] : current.filter((id) => id !== signer.id)))}
                        />
                        {signer.displayName}
                      </label>
                    ))}
                  </fieldset>
                )}
                <label className="flex cursor-pointer items-center gap-2 border-t border-default pt-3 font-semibold text-heading">
                  <input type="checkbox" checked={confirmedCopy} onChange={(event) => setConfirmedCopy(event.target.checked)} /> This is the document I signed
                </label>
              </div>
            )}
          </section>
        )}

        {step === 3 && (
          <section className="rounded-2xl border border-default bg-white p-6 shadow-sm">
            {paper ? (
              <>
                <h2 className="text-sm font-semibold text-heading">Nothing to confirm for paper</h2>
                <p className="mt-1 text-sm text-muted">Upload your signed copy with the button below.</p>
              </>
            ) : (
              <>
                <h2 className="text-sm font-semibold text-heading">Confirm with an email code</h2>
                <p className="mt-1 text-sm text-muted">We send a 6-digit code to {codeSentTo || status.emailMasked}. This is only for signing, not your login code.</p>
                <div className="mt-3 flex flex-wrap items-end gap-3">
                  <button type="button" onClick={requestCode} disabled={busy || verified} className={ghostButton}>
                    {codeSentTo ? "Send a new code" : "Send code"}
                  </button>
                  {codeSentTo && !verified && (
                    <>
                      <div>
                        <label htmlFor="code" className="mb-1 block text-xs font-semibold text-heading">Code</label>
                        <input id="code" inputMode="numeric" maxLength={7} value={code} onChange={(event) => setCode(event.target.value)} placeholder="123456" className={`${inputClass} w-36 tracking-widest`} />
                      </div>
                      <button type="button" onClick={checkCode} disabled={busy || code.replace(/\D/g, "").length !== 6} className={primaryButton}>
                        Verify code
                      </button>
                    </>
                  )}
                  {verified && <span className="text-sm font-semibold text-green-700">Code verified</span>}
                </div>
              </>
            )}
          </section>
        )}
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">{error}</p>}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-default pt-4">
        <div className="text-xs">
          {allComplete ? (
            <span className="font-semibold text-green-700">Everything is complete</span>
          ) : (
            <span className="text-accent-dark">
              <b>{complete.filter((done) => !done).length} step{complete.filter((done) => !done).length === 1 ? "" : "s"} left:</b> {missing.join(", ")}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {role === "tenant" && !declining && (
            <button type="button" onClick={() => setDeclining(true)} className="px-3 text-xs font-semibold text-muted hover:text-heading">
              I don&apos;t agree
            </button>
          )}
          <button type="button" onClick={() => go(Math.max(0, step - 1))} disabled={step === 0} className={ghostButton}>Back</button>
          <button type="button" onClick={() => go(Math.min(3, step + 1))} disabled={step === 3} className={ghostButton}>Next</button>
          <button type="button" onClick={submit} disabled={!allComplete || busy} className={primaryButton}>
            {busy ? "Working…" : paper ? "Upload signed copy" : "Sign lease"}
          </button>
        </div>
      </div>

      {declining && (
        <div className="rounded-2xl border border-default bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-heading">Decline this lease</h2>
          <p className="mt-1 text-xs text-muted">Your landlord is told. You can add a short note.</p>
          <textarea value={declineNote} onChange={(event) => setDeclineNote(event.target.value)} rows={2} maxLength={500} className={`${inputClass} mt-2`} />
          <div className="mt-3 flex justify-end gap-2">
            <button type="button" onClick={() => setDeclining(false)} className={ghostButton}>Cancel</button>
            <button type="button" onClick={decline} disabled={busy} className={primaryButton}>Decline lease</button>
          </div>
        </div>
      )}
    </div>
  );
}
