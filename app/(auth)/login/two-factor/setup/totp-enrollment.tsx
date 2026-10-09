"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RecoveryCodes } from "@/components/recovery-codes";
import { TotpCodeForm } from "@/components/totp-code-form";
import { beginTwoFactorSetupAction, enableTwoFactorAction } from "../actions";

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

  async function handleSubmit(code: string) {
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
    return (
      <RecoveryCodes
        codes={saved.recoveryCodes}
        continueLabel="Continue to dashboard"
        onContinue={() => router.replace(saved.destination)}
      />
    );
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
        <>
          <TotpCodeForm
            enrollment={enrollment}
            submitting={submitting}
            submitLabel="Turn on two-factor"
            submittingLabel="Turning on…"
            onSubmit={handleSubmit}
          />
          <Link href="/login" className="mt-4 block text-center text-sm text-muted">
            Back to log in
          </Link>
        </>
      )}
    </div>
  );
}
