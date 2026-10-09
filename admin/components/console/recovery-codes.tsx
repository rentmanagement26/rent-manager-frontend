"use client";

import { useState } from "react";
import { primaryButtonClass, secondaryButtonClass } from "@/components/console/ui";

export function RecoveryCodes({ codes, onContinue }: { codes: string[]; onContinue: () => void }) {
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

  return (
    <div className="max-w-md">
      <h3 className="text-base font-medium">Save your recovery codes</h3>
      <p className="mb-4 mt-1 text-[13px] text-c-tx2">
        Each code works once if you lose your authenticator. They won&apos;t be shown again.
      </p>
      <div className="mb-4 grid grid-cols-2 gap-2">
        {codes.map((code) => (
          <p key={code} className="rounded-lg bg-c-sf2 px-2 py-2 text-center font-mono text-sm">
            {code}
          </p>
        ))}
      </div>
      <div className="mb-4 flex gap-2">
        <button type="button" onClick={copyCodes} className={`${secondaryButtonClass} flex-1`}>
          {copied ? "Copied" : "Copy"}
        </button>
        <button type="button" onClick={downloadCodes} className={`${secondaryButtonClass} flex-1`}>
          Download
        </button>
      </div>
      <label className="mb-4 flex items-start gap-2 text-[13px] text-c-tx2">
        <input
          type="checkbox"
          checked={acknowledged}
          onChange={(event) => {
            setAcknowledged(event.target.checked);
            setMessage("");
          }}
          className="mt-0.5 accent-c-ac"
        />
        I&apos;ve saved these codes somewhere safe
      </label>
      {message && <p className="mb-3 text-[13px] text-c-badt">{message}</p>}
      <button type="button" onClick={handleContinue} className={primaryButtonClass}>
        Done
      </button>
    </div>
  );
}
