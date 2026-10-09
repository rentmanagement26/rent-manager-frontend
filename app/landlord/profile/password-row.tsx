"use client";

import { useState } from "react";
import { sendPasswordResetLinkAction } from "./actions";

export function PasswordRow() {
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleClick() {
    setSending(true);
    setMessage("");
    setError("");
    const result = await sendPasswordResetLinkAction();
    setSending(false);

    if ("error" in result) {
      setError(result.error);
      return;
    }
    setMessage(result.message);
  }

  return (
    <div className="flex items-center justify-between gap-4 border-t border-default py-4">
      <div>
        <p className="text-sm font-medium text-heading">Password</p>
        <p className="text-sm text-muted">We&apos;ll email you a link to set a new one.</p>
        {message && <p className="mt-1 text-sm font-medium text-green-700">{message}</p>}
        {error && <p className="mt-1 text-sm font-medium text-red-700">{error}</p>}
      </div>
      <button
        type="button"
        onClick={handleClick}
        disabled={sending}
        className="shrink-0 rounded-lg border border-default px-3.5 py-2 text-sm font-semibold text-heading hover:bg-subtle disabled:opacity-60"
      >
        {sending ? "Sending…" : message ? "Send again" : "Send reset link"}
      </button>
    </div>
  );
}
