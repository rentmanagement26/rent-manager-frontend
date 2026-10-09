"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { changePasswordAction, sendPasswordResetLinkAction } from "@/lib/profile-actions";
import { goToSessionExpired } from "@/lib/session-expired-client";

const inputClass =
  "rounded-xl border border-default px-3.5 py-2.5 text-heading outline-none focus:border-accent";

export function PasswordRow() {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [sendingLink, setSendingLink] = useState(false);
  const [linkMessage, setLinkMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const currentPassword = String(form.get("currentPassword") ?? "");
    const newPassword = String(form.get("newPassword") ?? "");

    if (newPassword !== String(form.get("confirmPassword") ?? "")) {
      setError("The new passwords don't match.");
      return;
    }

    setSaving(true);
    setError("");
    const result = await changePasswordAction(currentPassword, newPassword);
    setSaving(false);

    if ("error" in result) {
      if (result.expired) {
        goToSessionExpired();
      } else {
        setError(result.error);
      }
      return;
    }

    setOpen(false);
    setDone(true);
    setLinkMessage("");
  }

  async function handleSendLink() {
    setSendingLink(true);
    setLinkMessage("");
    const result = await sendPasswordResetLinkAction();
    setSendingLink(false);
    setLinkMessage("error" in result ? result.error : result.message);
  }

  if (!open) {
    return (
      <div className="flex items-center justify-between gap-4 border-t border-default py-4">
        <div>
          <p className="text-sm font-medium text-heading">Password</p>
          <p className="text-sm text-muted">Change it any time. This signs you out on other devices.</p>
          {done && (
            <p className="mt-1 text-sm font-medium text-green-700">
              Password updated. Your other devices were signed out.
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            setDone(false);
            setError("");
            setOpen(true);
          }}
          className="shrink-0 rounded-lg border border-default px-3.5 py-2 text-sm font-semibold text-heading hover:bg-subtle"
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 border-t border-default py-4">
      <p className="text-sm font-medium text-heading">Change password</p>

      <p className="rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
        Finishing this signs you out of every other device.
      </p>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">{error}</p>}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="currentPassword" className="text-sm font-semibold text-body">
          Current password
        </label>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          autoFocus
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="newPassword" className="text-sm font-semibold text-body">
          New password
        </label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          className={inputClass}
        />
        <p className="text-xs text-muted">
          At least 8 characters, with upper and lower case letters, a number, and a symbol.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirmPassword" className="text-sm font-semibold text-body">
          Confirm new password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          className={inputClass}
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-60"
        >
          {saving ? "Updating…" : "Update password"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError("");
            setLinkMessage("");
          }}
          className="rounded-lg border border-default px-4 py-2.5 text-sm font-semibold text-heading hover:bg-subtle"
        >
          Cancel
        </button>
      </div>

      <div>
        <button
          type="button"
          onClick={handleSendLink}
          disabled={sendingLink}
          className="text-sm text-accent hover:text-accent-dark disabled:opacity-60"
        >
          {sendingLink ? "Sending…" : "Forgot your current password? Email me a reset link"}
        </button>
        {linkMessage && <p className="mt-1 text-sm text-muted">{linkMessage}</p>}
      </div>
    </form>
  );
}
