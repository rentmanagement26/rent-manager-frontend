"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Modal } from "@/components/console/modal";
import { WarningBox, primaryButtonClass, secondaryButtonClass } from "@/components/console/ui";
import { formatWhen } from "@/lib/format";
import type { TemporaryPassword } from "@/lib/types";

// Shows a temporary password ONE time. The backend never shows it again and never emails it, so the admin must
// pass it to the person themselves (in person, by phone, ...). It works once; the person then chooses their own.
export function TemporaryPasswordModal({
  who,
  password,
  onClose,
}: {
  who: string; // e.g. "Priya Sharma"
  password: TemporaryPassword;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(password.temporaryPassword);
      setCopied(true);
    } catch {
      // Copy can be blocked by the browser; the password is still on screen to type or select by hand.
    }
  }

  return (
    <Modal title="Temporary password" subtitle={who} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <WarningBox>This is the only time it is shown. Give it to {who} yourself. It is not emailed.</WarningBox>

        <div className="flex items-center gap-2 rounded-xl bg-c-sf2 px-4 py-3">
          {/* select-all: one click selects the whole password. */}
          <code className="flex-1 select-all break-all font-mono text-[15px]">{password.temporaryPassword}</code>
          <button
            type="button"
            onClick={copy}
            aria-label="Copy password"
            className={`${secondaryButtonClass} flex h-9 items-center gap-1.5 px-3`}
          >
            {copied ? <Check size={15} /> : <Copy size={15} />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>

        <p className="text-xs text-c-tx2">
          It works for one sign-in and expires {formatWhen(password.expiresAt)}. They will choose their own password
          straight after.
        </p>

        <div className="flex justify-end">
          <button type="button" onClick={onClose} className={primaryButtonClass}>
            I&apos;ve saved it
          </button>
        </div>
      </div>
    </Modal>
  );
}
