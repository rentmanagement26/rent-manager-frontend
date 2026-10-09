"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TwoFactorStatus } from "@/lib/types";
import { RegenerateRecoveryCodes } from "./regenerate-recovery-codes";
import { ReplaceAuthenticator } from "./replace-authenticator";

type Panel = "none" | "regenerate" | "replace";

const rowButtonClass =
  "shrink-0 rounded-lg border border-default px-3.5 py-2 text-sm font-semibold text-heading hover:bg-subtle";

export function SecuritySettings({ status }: { status: TwoFactorStatus }) {
  const router = useRouter();
  const [panel, setPanel] = useState<Panel>("none");

  function closePanel(refresh: boolean) {
    setPanel("none");
    if (refresh) router.refresh();
  }

  const low = status.recoveryCodesRemaining <= 1;

  return (
    <div className="max-w-2xl rounded-2xl border border-default bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-heading">Two-factor authentication</h2>
          <p className="mt-0.5 text-sm text-muted">Protects your account with a code from your authenticator app.</p>
        </div>
        <span
          className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold ${
            status.enabled ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"
          }`}
        >
          {status.enabled ? "On" : "Off"}
        </span>
      </div>

      {!status.enabled && (
        <p className="mt-4 border-t border-default pt-4 text-sm text-muted">
          Two-factor is set up the next time you log in.
        </p>
      )}

      {status.enabled && panel === "none" && (
        <div className="mt-4">
          <div className="flex items-center justify-between gap-4 border-t border-default py-4">
            <div>
              <p className="text-sm font-medium text-heading">Recovery codes</p>
              <p className={`text-sm ${low ? "text-amber-700" : "text-muted"}`}>
                {status.recoveryCodesRemaining} left.{" "}
                {low ? "Regenerate soon." : "Each works once if you lose your authenticator."}
              </p>
            </div>
            <button type="button" onClick={() => setPanel("regenerate")} className={rowButtonClass}>
              Regenerate
            </button>
          </div>
          <div className="flex items-center justify-between gap-4 border-t border-default pt-4">
            <div>
              <p className="text-sm font-medium text-heading">Authenticator app</p>
              <p className="text-sm text-muted">Switch to a new phone or authenticator app.</p>
            </div>
            <button type="button" onClick={() => setPanel("replace")} className={rowButtonClass}>
              Replace
            </button>
          </div>
        </div>
      )}

      {status.enabled && panel === "regenerate" && (
        <div className="mt-4 border-t border-default pt-4">
          <RegenerateRecoveryCodes onClose={closePanel} />
        </div>
      )}

      {status.enabled && panel === "replace" && (
        <div className="mt-4 border-t border-default pt-4">
          <ReplaceAuthenticator onClose={closePanel} />
        </div>
      )}
    </div>
  );
}
