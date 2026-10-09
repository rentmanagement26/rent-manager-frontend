"use client";

import { useState } from "react";
import type { ComponentProps, FormEvent } from "react";
import {
  ErrorBox,
  WarningBox,
  cardClass,
  goToSessionExpired,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/console/ui";
import { changePasswordAction } from "@/lib/security-actions";

function Field({ id, label, hint, ...input }: { id: string; label: string; hint?: string } & ComponentProps<"input">) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] text-c-tx2">
        {label}
      </label>
      <input id={id} name={id} required className={inputClass} {...input} />
      {hint && <p className="text-xs text-c-tx3">{hint}</p>}
    </div>
  );
}

export function PasswordCard() {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const newPassword = String(form.get("newPassword") ?? "");

    if (newPassword !== String(form.get("confirmPassword") ?? "")) {
      setError("The new passwords don't match.");
      return;
    }

    setSaving(true);
    setError("");
    const result = await changePasswordAction(String(form.get("currentPassword") ?? ""), newPassword);
    setSaving(false);

    if ("error" in result) {
      if (result.expired) goToSessionExpired();
      else setError(result.error);
      return;
    }
    setOpen(false);
    setDone(true);
  }

  return (
    <section className={cardClass}>
      <h2 className="text-base font-medium">Password</h2>
      <p className="mt-0.75 text-[13px] text-c-tx2">Change it any time. This signs you out on other devices.</p>

      {!open && (
        <div className="mt-4 flex items-center justify-between gap-4 border-t border-c-bd pt-4">
          <p className={`text-[13px] ${done ? "text-c-okt" : "text-c-tx2"}`}>
            {done ? "Password updated. Your other devices were signed out." : "Use a long, unique password."}
          </p>
          <button
            type="button"
            onClick={() => {
              setDone(false);
              setError("");
              setOpen(true);
            }}
            className={`${secondaryButtonClass} shrink-0`}
          >
            Change
          </button>
        </div>
      )}

      {open && (
        <form onSubmit={handleSubmit} className="mt-4 flex max-w-md flex-col gap-4 border-t border-c-bd pt-4">
          <WarningBox>Finishing this signs you out of every other device.</WarningBox>
          <ErrorBox message={error} />
          <Field id="currentPassword" label="Current password" type="password" autoComplete="current-password" autoFocus />
          <Field
            id="newPassword"
            label="New password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            hint="At least 8 characters, with upper and lower case letters, a number, and a symbol."
          />
          <Field id="confirmPassword" label="Confirm new password" type="password" autoComplete="new-password" />
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className={primaryButtonClass}>
              {saving ? "Updating…" : "Update password"}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setError("");
              }}
              className={secondaryButtonClass}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
