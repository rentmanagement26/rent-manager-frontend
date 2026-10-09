"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RecoveryCodes({ codes, destination }: { codes: string[]; destination: string }) {
  const router = useRouter();
  const [acknowledged, setAcknowledged] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState("");

  async function copyCodes() {
    try {
      await navigator.clipboard.writeText(codes.join("\n"));
      setCopied(true);
    } catch {
      setMessage("Couldn't copy. Select the codes and copy them manually.");
    }
  }

  function downloadCodes() {
    const text = `DomusPRO recovery codes\nEach code works once. Keep them somewhere safe.\n\n${codes.join("\n")}\n`;
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "domuspro-recovery-codes.txt";
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleContinue() {
    if (!acknowledged) {
      setMessage("Confirm you've saved your recovery codes first.");
      return;
    }
    router.replace(destination);
  }

  const secondaryButtonClass =
    "flex-1 rounded-xl border border-default px-3 py-2.5 text-sm font-semibold text-heading hover:bg-subtle";

  return (
    <div>
      <h2 className="mb-2 font-head text-2xl font-bold text-heading">Save your recovery codes</h2>
      <p className="mb-6 text-sm text-muted">
        Each code works once if you lose your authenticator. They won&apos;t be shown again.
      </p>

      <div className="mb-4 grid grid-cols-2 gap-2">
        {codes.map((code) => (
          <p key={code} className="rounded-lg bg-subtle px-2 py-2 text-center font-mono text-sm text-heading">
            {code}
          </p>
        ))}
      </div>

      <div className="mb-4 flex gap-2">
        <button type="button" onClick={copyCodes} className={secondaryButtonClass}>
          {copied ? "Copied" : "Copy"}
        </button>
        <button type="button" onClick={downloadCodes} className={secondaryButtonClass}>
          Download
        </button>
      </div>

      <label className="mb-4 flex items-start gap-2 text-sm text-body">
        <input
          type="checkbox"
          checked={acknowledged}
          onChange={(event) => {
            setAcknowledged(event.target.checked);
            setMessage("");
          }}
          className="mt-0.5"
        />
        I&apos;ve saved these codes somewhere safe
      </label>

      {message && <p className="mb-3 text-sm font-medium text-red-700">{message}</p>}

      <button
        type="button"
        onClick={handleContinue}
        className="w-full rounded-xl bg-accent px-4 py-3 font-semibold text-white shadow-lg shadow-accent/25 hover:bg-accent-dark"
      >
        Continue to dashboard
      </button>
    </div>
  );
}
