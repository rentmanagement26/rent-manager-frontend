"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { beginTwoFactorSetupAction, enableTwoFactorAction } from "../actions";
import { RecoveryCodes } from "./recovery-codes";

const inputClass =
  "rounded-xl border border-default px-3.5 py-2.5 text-heading outline-none focus:border-accent";
const buttonClass =
  "mt-2 rounded-xl bg-accent px-4 py-3 font-semibold text-white shadow-lg shadow-accent/25 hover:bg-accent-dark disabled:opacity-60";

export function TotpEnrollment({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  const [enrollment, setEnrollment] = useState<{ sharedKey: string; authenticatorUri: string } | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState<{ recoveryCodes: string[]; destination: string } | null>(null);
  const started = useRef(false);

  // Each setup call can issue a new key, so make sure it only runs once (React Strict Mode
  // runs effects twice in development).
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
    const result = await enableTwoFactorAction(code, redirectTo);
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
    return <RecoveryCodes codes={saved.recoveryCodes} destination={saved.destination} />;
  }

  return (
    <div>
      <h2 className="mb-2 font-head text-2xl font-bold text-heading">Set up two-factor authentication</h2>
      <p className="mb-6 text-sm text-muted">Required for every account. It takes about a minute.</p>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">{error}</p>
      )}

      {!enrollment && !error && <p className="text-sm text-muted">Preparing your setup…</p>}

      {enrollment && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <p className="text-sm font-semibold text-body">1. Scan this QR code with an authenticator app</p>
          <div className="flex justify-center">
            <div className="rounded-xl border border-default bg-white p-3">
              <QRCodeSVG value={enrollment.authenticatorUri} size={168} title="Authenticator app QR code" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted">Can&apos;t scan? Enter this key instead</p>
            <p className="mt-1 break-all rounded-lg bg-subtle px-3 py-2 font-mono text-sm text-heading">
              {enrollment.sharedKey.replace(/(.{4})/g, "$1 ").trim()}
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="code" className="text-sm font-semibold text-body">
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
          </div>

          <button type="submit" disabled={submitting} className={buttonClass}>
            {submitting ? "Turning on…" : "Turn on two-factor"}
          </button>
          <Link href="/login" className="text-center text-sm text-muted">
            Back to log in
          </Link>
        </form>
      )}
    </div>
  );
}
