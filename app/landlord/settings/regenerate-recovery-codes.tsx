"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { RecoveryCodes } from "@/components/recovery-codes";
import { regenerateRecoveryCodesAction } from "./actions";

export function RegenerateRecoveryCodes({ onClose }: { onClose: (refresh: boolean) => void }) {
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [codes, setCodes] = useState<string[] | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = String(new FormData(event.currentTarget).get("code") ?? "");

    setSubmitting(true);
    setError("");
    const result = await regenerateRecoveryCodesAction(code);
    setSubmitting(false);

    if ("error" in result) {
      if (result.expired) {
        // Hard navigation on purpose: /session-expired is a route handler that clears the dead cookie.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.assign("/session-expired");
      } else {
        setError(result.error);
      }
      return;
    }
    setCodes(result.recoveryCodes);
  }

  if (codes) {
    return <RecoveryCodes compact codes={codes} continueLabel="Done" onContinue={() => onClose(true)} />;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <h3 className="text-base font-semibold text-heading">Regenerate recovery codes</h3>
        <p className="mt-0.5 text-sm text-muted">
          Your current codes will stop working. Enter the 6-digit code from your authenticator app to continue.
        </p>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">{error}</p>}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="regen-code" className="text-sm font-semibold text-body">
          Authentication code
        </label>
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
          className="w-48 rounded-xl border border-default px-3.5 py-2.5 text-center text-xl tracking-[0.4em] text-heading outline-none focus:border-accent"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-60"
        >
          {submitting ? "Generating…" : "Generate new codes"}
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
  );
}
