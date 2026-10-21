"use client";

// "Propose plan to N landlords": pick a plan, see who could accept it (the backend's preview), add a message and how long they
// have to answer, then send. Landlords who could not accept (over the limits), are already there or have no plan are left out
// and reported. Nothing changes for anyone until they accept, through the link in their email or in the app.
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Modal } from "@/components/console/modal";
import { ErrorBox, WarningBox, goToSessionExpired, inputClass, primaryButtonClass, secondaryButtonClass } from "@/components/console/ui";
import { formatPrice } from "@/lib/format";
import { previewBulkProposalsAction, sendBulkProposalsAction } from "@/lib/proposal-actions";
import type { AdminPackage, BulkProposalPreview, BulkSendResult } from "@/lib/types";

interface Props {
  packages: AdminPackage[];
  people: { id: number; name: string }[];
  onClose: () => void;
  // Called when the popup should close after sending (the selection is cleared by the caller).
  onSent: () => void;
}

export function BulkProposalModal({ packages, people, onClose, onSent }: Props) {
  const router = useRouter();
  const ids = people.map((p) => p.id);

  const [planId, setPlanId] = useState<number | null>(null);
  const [preview, setPreview] = useState<BulkProposalPreview | null>(null);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState("");
  const [staffNote, setStaffNote] = useState("");
  const [openDays, setOpenDays] = useState("14");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  // Set after sending: the summary replaces the form.
  const [result, setResult] = useState<BulkSendResult | null>(null);

  const choices = packages.filter((p) => p.isActive).sort((a, b) => a.sortOrder - b.sortOrder);

  // Choosing a plan asks the backend who could accept it.
  async function choose(pkg: AdminPackage) {
    setPlanId(pkg.packageId);
    setPreview(null);
    setError("");
    setChecking(true);
    const answer = await previewBulkProposalsAction(ids, pkg.packageId);
    setChecking(false);

    if ("error" in answer) {
      if (answer.expired) return goToSessionExpired();
      setError(answer.error);
      return;
    }
    setPreview(answer.preview);
  }

  async function send() {
    if (planId === null) return;
    setSending(true);
    setError("");
    const answer = await sendBulkProposalsAction({
      landlordProfileIds: ids,
      packageId: planId,
      message,
      staffNote,
      expiresInDays: openDays === "none" ? null : Number(openDays),
    });
    setSending(false);

    if ("error" in answer) {
      if (answer.expired) return goToSessionExpired();
      setError(answer.error);
      return;
    }
    setResult(answer.result);
    router.refresh();
  }

  const nameOf = (id: number) => people.find((p) => p.id === id)?.name ?? `Landlord ${id}`;
  const canSend = preview !== null && preview.summary.canPropose > 0 && !sending;

  // ---- After sending: how it went
  if (result) {
    const { summary } = result;
    const left = result.items.filter((i) => i.outcome !== "proposed");
    return (
      <Modal title="Proposals sent" onClose={onSent}>
        <div className="flex flex-col gap-4">
          <p className="rounded-[10px] bg-c-ok px-3 py-2.5 text-[13px] text-c-okt">
            {summary.proposed} {summary.proposed === 1 ? "proposal" : "proposals"} sent
            {left.length > 0 && `, ${left.length} left out`}.
          </p>
          {left.map((item) => (
            <p key={item.landlordProfileId} className="text-[13px] text-c-tx2">
              {item.name ?? nameOf(item.landlordProfileId)}: {item.message ?? "Left out."}
            </p>
          ))}
          <div className="flex justify-end">
            <button type="button" onClick={onSent} className={primaryButtonClass}>
              Done
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title={`Propose plan to ${people.length} ${people.length === 1 ? "landlord" : "landlords"}`} subtitle="Pick the plan, then check who can accept it." busy={sending} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-xs text-c-tx2">Plan to offer</legend>
          {choices.map((pkg) => (
            <button
              key={pkg.packageId}
              type="button"
              disabled={sending}
              onClick={() => choose(pkg)}
              className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                pkg.packageId === planId ? "border-c-ac bg-c-aci text-c-act2" : "border-c-bd hover:bg-c-sf2"
              }`}
            >
              <span className="text-sm font-medium">{pkg.name}</span>
              <span className="text-sm">{formatPrice(pkg.monthlyPrice)}/mo</span>
            </button>
          ))}
        </fieldset>

        {checking && <p className="text-[13px] text-c-tx2">Checking who can accept…</p>}

        {preview && (
          <div className="rounded-xl bg-c-sf2 px-4 py-3 text-[13px]">
            <p className="font-medium">
              {preview.summary.canPropose} can be offered · {preview.summary.overLimits} over the limits · {preview.summary.alreadyThere}{" "}
              already there
              {preview.summary.notFound > 0 && ` · ${preview.summary.notFound} not found`}
            </p>
            {preview.items
              .filter((i) => i.outcome !== "can_propose")
              .map((item) => (
                <p key={item.landlordProfileId} className="mt-1.5 text-c-tx2">
                  {item.name ?? nameOf(item.landlordProfileId)}:{" "}
                  {item.violations.length > 0
                    ? item.violations.map((v) => `${v.displayName} ${v.used} used, limit ${v.limit}`).join("; ") + ". Left out."
                    : `${item.message ?? "Left out."}`}
                </p>
              ))}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label htmlFor="bulk-message" className="text-xs text-c-tx2">
            Message in the email and app (optional)
          </label>
          <textarea
            id="bulk-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={500}
            rows={2}
            className={`${inputClass} h-auto py-2.5`}
          />
          <label htmlFor="bulk-note" className="text-xs text-c-tx2">
            Private staff note (optional)
          </label>
          <input id="bulk-note" value={staffNote} onChange={(e) => setStaffNote(e.target.value)} maxLength={500} className={inputClass} />
          <label htmlFor="bulk-open" className="text-xs text-c-tx2">
            How long they have to answer
          </label>
          <select id="bulk-open" value={openDays} onChange={(e) => setOpenDays(e.target.value)} className={inputClass}>
            <option value="7">7 days</option>
            <option value="14">14 days</option>
            <option value="30">30 days</option>
            <option value="90">90 days</option>
            <option value="none">No end date</option>
          </select>
        </div>

        <WarningBox>Each landlord is emailed and answers for themselves. Nothing changes for anyone until they accept.</WarningBox>
        <ErrorBox message={error} />

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={sending} className={secondaryButtonClass}>
            Cancel
          </button>
          <button type="button" onClick={send} disabled={!canSend} className={primaryButtonClass}>
            {sending ? "Sending…" : preview ? `Send to ${preview.summary.canPropose}` : "Send"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
