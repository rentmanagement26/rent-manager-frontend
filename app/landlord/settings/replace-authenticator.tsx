"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { RecoveryCodes } from "@/components/recovery-codes";
import { TotpCodeForm } from "@/components/totp-code-form";
import { confirmAuthenticatorReplacementAction, startAuthenticatorReplacementAction } from "./actions";

type Enrollment = { sharedKey: string; authenticatorUri: string };
type Step = { name: "verify" } | { name: "scan"; enrollment: Enrollment } | { name: "codes"; codes: string[] };

const inputClass =
  "rounded-xl border border-default px-3.5 py-2.5 text-heading outline-none focus:border-accent";

export function ReplaceAuthenticator({ onClose }: { onClose: (refresh: boolean) => void }) {
  const [step, setStep] = useState<Step>({ name: "verify" });
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleFailure(result: { error: string; expired: boolean }) {
    if (result.expired) {
      // Hard navigation on purpose: /session-expired is a route handler that clears the dead cookie.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/session-expired");
    } else {
      setError(result.error);
    }
  }

  async function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    setSubmitting(true);
    setError("");
    const result = await startAuthenticatorReplacementAction(
      String(form.get("password") ?? ""),
      String(form.get("code") ?? ""),
      String(form.get("recoveryCode") ?? "")
    );
    setSubmitting(false);

    if ("error" in result) {
      handleFailure(result);
      return;
    }
    setStep({ name: "scan", enrollment: result });
  }

  async function handleConfirm(code: string) {
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
    return <RecoveryCodes compact codes={step.codes} continueLabel="Done" onContinue={() => onClose(true)} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-base font-semibold text-heading">Replace authenticator</h3>
        <p className="mt-0.5 text-sm text-muted">
          {step.name === "verify"
            ? "Confirm it's you first, then scan a new QR code."
            : "You have 15 minutes to finish."}
        </p>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">{error}</p>}

      {step.name === "verify" && (
        <form onSubmit={handleVerify} className="flex flex-col gap-4">
          <p className="rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
            Finishing this signs you out of every other device, and your old authenticator and recovery codes stop
            working.
          </p>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="replace-password" className="text-sm font-semibold text-body">
              Password
            </label>
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
            <label htmlFor="replace-proof" className="text-sm font-semibold text-body">
              {useRecoveryCode ? "Recovery code" : "Authentication code"}
            </label>
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
                className={`${inputClass} w-48 text-center text-xl tracking-[0.4em]`}
              />
            )}
            <button
              type="button"
              onClick={() => setUseRecoveryCode((value) => !value)}
              className="self-start text-sm text-accent hover:text-accent-dark"
            >
              {useRecoveryCode ? "Use your authenticator app instead" : "Use a recovery code instead"}
            </button>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-60"
            >
              {submitting ? "Checking…" : "Continue"}
            </button>
            <button
              type="button"
              onClick={() => onClose(false)}
              className="rounded-lg border border-default px-4 py-2.5 text-sm font-semibold text-heading hover:bg-subtle"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {step.name === "scan" && (
        <>
          <TotpCodeForm
            enrollment={step.enrollment}
            submitting={submitting}
            submitLabel="Replace authenticator"
            submittingLabel="Replacing…"
            onSubmit={handleConfirm}
          />
          <button
            type="button"
            onClick={() => onClose(false)}
            className="self-center text-sm text-muted hover:text-heading"
          >
            Cancel
          </button>
        </>
      )}
    </div>
  );
}
