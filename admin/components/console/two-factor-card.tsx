"use client";

import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import type { FormEvent } from "react";
import { RecoveryCodes } from "@/components/console/recovery-codes";
import {
  ErrorBox,
  Pill,
  WarningBox,
  cardClass,
  goToSessionExpired,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/console/ui";
import {
  confirmAuthenticatorReplacementAction,
  regenerateRecoveryCodesAction,
  startAuthenticatorReplacementAction,
} from "@/lib/security-actions";
import type { ActionFailure, TwoFactorEnrollment, TwoFactorStatus } from "@/lib/types";

type Panel = "none" | "regenerate" | "replace";

const codeInputClass = `${inputClass} w-48 text-center text-xl tracking-[0.4em]`;

function Label({ htmlFor, children }: { htmlFor: string; children: string }) {
  return (
    <label htmlFor={htmlFor} className="text-[13px] text-c-tx2">
      {children}
    </label>
  );
}

// A dead session sends them to sign in; any other failure shows inline.
function failureHandler(setError: (message: string) => void) {
  return (result: ActionFailure) => {
    if (result.expired) goToSessionExpired();
    else setError(result.error);
  };
}

function RegenerateRecoveryCodes({ onClose }: { onClose: (refresh: boolean) => void }) {
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [codes, setCodes] = useState<string[] | null>(null);
  const handleFailure = failureHandler(setError);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = String(new FormData(event.currentTarget).get("code") ?? "");
    setSubmitting(true);
    setError("");
    const result = await regenerateRecoveryCodesAction(code);
    setSubmitting(false);

    if ("error" in result) {
      handleFailure(result);
      return;
    }
    setCodes(result.recoveryCodes);
  }

  if (codes) {
    return <RecoveryCodes codes={codes} onContinue={() => onClose(true)} />;
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-md flex-col gap-4">
      <div>
        <h3 className="text-base font-medium">Regenerate recovery codes</h3>
        <p className="mt-1 text-[13px] text-c-tx2">
          Your current codes will stop working. Enter the 6-digit code from your authenticator app to continue.
        </p>
      </div>
      <ErrorBox message={error} />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="regen-code">Authentication code</Label>
        <input
          id="regen-code"
          name="code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="000000"
          maxLength={7}
          required
          autoFocus
          className={codeInputClass}
        />
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={submitting} className={primaryButtonClass}>
          {submitting ? "Generating…" : "Generate new codes"}
        </button>
        <button type="button" onClick={() => onClose(false)} className={secondaryButtonClass}>
          Cancel
        </button>
      </div>
    </form>
  );
}

type Step = { name: "verify" } | { name: "scan"; enrollment: TwoFactorEnrollment } | { name: "codes"; codes: string[] };

function ReplaceAuthenticator({ onClose }: { onClose: (refresh: boolean) => void }) {
  const [step, setStep] = useState<Step>({ name: "verify" });
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const handleFailure = failureHandler(setError);

  async function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    setError("");
    const result = await startAuthenticatorReplacementAction(
      String(form.get("password") ?? ""),
      String(form.get("code") ?? ""),
      String(form.get("recoveryCode") ?? ""),
    );
    setSubmitting(false);

    if ("error" in result) {
      handleFailure(result);
      return;
    }
    setStep({ name: "scan", enrollment: result });
  }

  async function handleConfirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = String(new FormData(event.currentTarget).get("code") ?? "");
    setSubmitting(true);
    setError("");
    const result = await confirmAuthenticatorReplacementAction(code);
    setSubmitting(false);

    if ("error" in result) {
      handleFailure(result);
      return;
    }
    setStep({ name: "codes", codes: result.recoveryCodes });
  }

  if (step.name === "codes") {
    return <RecoveryCodes codes={step.codes} onContinue={() => onClose(true)} />;
  }

  return (
    <div className="flex max-w-md flex-col gap-4">
      <div>
        <h3 className="text-base font-medium">Replace authenticator</h3>
        <p className="mt-1 text-[13px] text-c-tx2">
          {step.name === "verify" ? "Confirm it's you first, then scan a new QR code." : "You have 15 minutes to finish."}
        </p>
      </div>
      <ErrorBox message={error} />

      {step.name === "verify" && (
        <form onSubmit={handleVerify} className="flex flex-col gap-4">
          <WarningBox>
            Finishing this signs you out of every other device, and your old authenticator and recovery codes stop
            working.
          </WarningBox>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="replace-password">Password</Label>
            <input
              id="replace-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              autoFocus
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="replace-proof">{useRecoveryCode ? "Recovery code" : "Authentication code"}</Label>
            {useRecoveryCode ? (
              <input
                id="replace-proof"
                key="recovery"
                name="recoveryCode"
                type="text"
                autoComplete="off"
                spellCheck={false}
                required
                className={inputClass}
              />
            ) : (
              <input
                id="replace-proof"
                key="code"
                name="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                maxLength={7}
                required
                className={codeInputClass}
              />
            )}
            <button
              type="button"
              onClick={() => setUseRecoveryCode((value) => !value)}
              className="self-start text-[13px] text-c-act2 hover:underline"
            >
              {useRecoveryCode ? "Use your authenticator app instead" : "Use a recovery code instead"}
            </button>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={submitting} className={primaryButtonClass}>
              {submitting ? "Checking…" : "Continue"}
            </button>
            <button type="button" onClick={() => onClose(false)} className={secondaryButtonClass}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {step.name === "scan" && (
        <form onSubmit={handleConfirm} className="flex flex-col gap-4">
          <p className="text-[13px] text-c-tx2">1. Scan this QR code with an authenticator app</p>
          <div className="flex justify-center">
            <div className="rounded-xl border border-c-bd bg-white p-3">
              <QRCodeSVG value={step.enrollment.authenticatorUri} size={168} title="Authenticator app QR code" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-xs text-c-tx3">Can&apos;t scan? Enter this key instead</p>
            <p className="mt-1 break-all rounded-lg bg-c-sf2 px-3 py-2 font-mono text-sm">
              {step.enrollment.sharedKey.replace(/(.{4})/g, "$1 ").trim()}
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-code">2. Enter the 6-digit code it shows</Label>
            <input
              id="new-code"
              name="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              maxLength={7}
              required
              className={codeInputClass}
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={submitting} className={primaryButtonClass}>
              {submitting ? "Replacing…" : "Replace authenticator"}
            </button>
            <button type="button" onClick={() => onClose(false)} className={secondaryButtonClass}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export function TwoFactorCard({ status }: { status: TwoFactorStatus }) {
  const router = useRouter();
  const [panel, setPanel] = useState<Panel>("none");

  function closePanel(refresh: boolean) {
    setPanel("none");
    if (refresh) router.refresh();
  }

  const low = status.recoveryCodesRemaining <= 1;

  return (
    <section className={cardClass}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-medium">Two-factor authentication</h2>
          <p className="mt-0.75 text-[13px] text-c-tx2">Required for every admin account.</p>
        </div>
        <Pill className={status.enabled ? "bg-c-ok text-c-okt" : "bg-c-sf2 text-c-tx2"}>
          {status.enabled ? "On" : "Off"}
        </Pill>
      </div>

      {!status.enabled && (
        <p className="mt-4 border-t border-c-bd pt-4 text-[13px] text-c-tx2">
          Two-factor is set up the next time you sign in.
        </p>
      )}

      {status.enabled && panel === "none" && (
        <div className="mt-4">
          <div className="flex items-center justify-between gap-4 border-t border-c-bd py-4">
            <div>
              <p className="text-sm font-medium">Recovery codes</p>
              <p className={`text-[13px] ${low ? "text-c-wrt" : "text-c-tx2"}`}>
                {status.recoveryCodesRemaining} left.{" "}
                {low ? "Regenerate soon." : "Each works once if you lose your authenticator."}
              </p>
            </div>
            <button type="button" onClick={() => setPanel("regenerate")} className={`${secondaryButtonClass} shrink-0`}>
              Regenerate
            </button>
          </div>
          <div className="flex items-center justify-between gap-4 border-t border-c-bd pt-4">
            <div>
              <p className="text-sm font-medium">Authenticator app</p>
              <p className="text-[13px] text-c-tx2">Switch to a new phone or authenticator app.</p>
            </div>
            <button type="button" onClick={() => setPanel("replace")} className={`${secondaryButtonClass} shrink-0`}>
              Replace
            </button>
          </div>
        </div>
      )}

      {status.enabled && panel === "regenerate" && (
        <div className="mt-4 border-t border-c-bd pt-4">
          <RegenerateRecoveryCodes onClose={closePanel} />
        </div>
      )}
      {status.enabled && panel === "replace" && (
        <div className="mt-4 border-t border-c-bd pt-4">
          <ReplaceAuthenticator onClose={closePanel} />
        </div>
      )}
    </section>
  );
}
