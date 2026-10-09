"use client";

import type { FormEvent } from "react";
import { QRCodeSVG } from "qrcode.react";

interface TotpCodeFormProps {
  enrollment: { sharedKey: string; authenticatorUri: string };
  submitting: boolean;
  submitLabel: string;
  submittingLabel: string;
  onSubmit: (code: string) => void;
}

export function TotpCodeForm({ enrollment, submitting, submitLabel, submittingLabel, onSubmit }: TotpCodeFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(String(new FormData(event.currentTarget).get("code") ?? ""));
  }

  return (
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
          className="rounded-xl border border-default px-3.5 py-2.5 text-center text-xl tracking-[0.4em] text-heading outline-none focus:border-accent"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="mt-2 rounded-xl bg-accent px-4 py-3 font-semibold text-white shadow-lg shadow-accent/25 hover:bg-accent-dark disabled:opacity-60"
      >
        {submitting ? submittingLabel : submitLabel}
      </button>
    </form>
  );
}
