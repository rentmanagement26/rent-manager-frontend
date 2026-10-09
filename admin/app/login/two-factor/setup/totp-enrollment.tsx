"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { ErrorNote, inputClass, primaryButtonClass } from "@/components/form-bits";
import { beginTwoFactorSetupAction, enableTwoFactorAction } from "../actions";

export function TotpEnrollment() {
  const router = useRouter();
  const [enrollment, setEnrollment] = useState<{ sharedKey: string; authenticatorUri: string } | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState<{ recoveryCodes: string[]; destination: string } | null>(null);
  const started = useRef(false);

  // Each setup call can issue a new key, so run it once (React Strict Mode runs effects twice in dev).
  useEffect(() => {
    if (started.current) return;
    started.current = true;

    beginTwoFactorSetupAction().then((result) => {
      if ("error" in result) {
        if (result.expired) {
          router.replace(`/login?error=${encodeURIComponent(result.error)}`);
        } else {
          setError(result.error);
        }
        return;
      }
      setEnrollment(result);
    });
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = String(new FormData(event.currentTarget).get("code") ?? "");
    setSubmitting(true);
    setError("");
    const result = await enableTwoFactorAction(code);
    setSubmitting(false);

    if ("error" in result) {
      if (result.expired) {
        router.replace(`/login?error=${encodeURIComponent(result.error)}`);
      } else {
        setError(result.error);
      }
      return;
    }
    setSaved(result);
  }

  if (saved) {
    return <RecoveryCodes codes={saved.recoveryCodes} onContinue={() => router.replace(saved.destination)} />;
  }

  return (
    <div>
      <h1 className="mb-1.5 text-[25px] font-medium tracking-tight">Set up two-step verification</h1>
      <p className="mb-6 text-sm leading-normal text-ink-2">Required for every admin account. It takes about a minute.</p>

      <ErrorNote message={error} />

      {!enrollment && !error && <p className="text-sm text-ink-2">Preparing your setup…</p>}

      {enrollment && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <p className="text-[13px] text-ink-2">1. Scan this QR code with an authenticator app</p>
          <div className="flex justify-center">
            <div className="rounded-xl border border-line bg-white p-3">
              <QRCodeSVG value={enrollment.authenticatorUri} size={168} title="Authenticator app QR code" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-xs text-ink-3">Can&apos;t scan? Enter this key instead</p>
            <p className="mt-1 break-all rounded-lg bg-surface-2 px-3 py-2 font-mono text-sm">
              {enrollment.sharedKey.replace(/(.{4})/g, "$1 ").trim()}
            </p>
          </div>

          <label htmlFor="code" className="text-[13px] text-ink-2">
            2. Enter the 6-digit code it shows
          </label>
          <input
            id="code"
            name="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="000000"
            maxLength={7}
            required
            className={`${inputClass} text-center text-xl tracking-[0.4em]`}
          />

          <button type="submit" disabled={submitting} className={primaryButtonClass}>
            {submitting ? "Turning on…" : "Turn on two-step verification"}
          </button>
          <Link href="/login" className="text-center text-[13px] text-ink-2 hover:text-ink">
            ← Back to sign in
          </Link>
        </form>
      )}
    </div>
  );
}

function RecoveryCodes({ codes, onContinue }: { codes: string[]; onContinue: () => void }) {
  const [acknowledged, setAcknowledged] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState("");

  async function copyCodes() {
    try {
      await navigator.clipboard.writeText(codes.join("\n"));
      setCopied(true);
    } catch {
      setMessage("Couldn't copy. Select the codes and copy them yourself.");
    }
  }

  function downloadCodes() {
    const text = `DomusPRO admin recovery codes\nEach code works once. Keep them somewhere safe.\n\n${codes.join("\n")}\n`;
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "domuspro-admin-recovery-codes.txt";
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleContinue() {
    if (!acknowledged) {
      setMessage("Confirm you've saved your recovery codes first.");
      return;
    }
    onContinue();
  }

  const secondary =
    "flex-1 rounded-xl border border-line-2 px-3 py-2.5 text-sm text-ink transition hover:bg-surface-2 active:scale-[0.98]";

  return (
    <div>
      <h1 className="mb-1.5 text-[25px] font-medium tracking-tight">Save your recovery codes</h1>
      <p className="mb-6 text-sm leading-normal text-ink-2">
        Each code works once if you lose your authenticator. They won&apos;t be shown again.
      </p>

      <div className="mb-4 grid grid-cols-2 gap-2">
        {codes.map((code) => (
          <p key={code} className="rounded-lg bg-surface-2 px-2 py-2 text-center font-mono text-sm">
            {code}
          </p>
        ))}
      </div>

      <div className="mb-4 flex gap-2">
        <button type="button" onClick={copyCodes} className={secondary}>
          {copied ? "Copied" : "Copy"}
        </button>
        <button type="button" onClick={downloadCodes} className={secondary}>
          Download
        </button>
      </div>

      <label className="mb-4 flex items-start gap-2 text-sm text-ink-2">
        <input
          type="checkbox"
          checked={acknowledged}
          onChange={(event) => {
            setAcknowledged(event.target.checked);
            setMessage("");
          }}
          className="mt-0.5 accent-brand"
        />
        I&apos;ve saved these codes somewhere safe
      </label>

      {message && <p className="mb-3 text-[13px] text-alert-text">{message}</p>}

      <button type="button" onClick={handleContinue} className={primaryButtonClass}>
        Continue to the console
      </button>
    </div>
  );
}
