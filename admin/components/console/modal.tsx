"use client";

import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

// A popup used by the admin console's forms (reset 2FA, new staff account, and so on).
// Layout: a dark backdrop, and a card in the middle on desktop or sliding up from the bottom on a phone.
//
// The parent decides when it is shown (render it only while open). `busy` stops it closing while a request is running.
export function Modal({
  title,
  subtitle,
  busy = false,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  busy?: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  // Escape closes the popup, but not in the middle of saving.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [busy, onClose]);

  // The popup is drawn straight into the page wrapper (a "portal"), not inside the card that opened it. The cards fade in
  // with a CSS transform, and a transformed parent makes "fixed" mean "relative to that card", which would
  // squash the popup into the card's corner. In <body> it always covers the whole screen.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      {/* Dimmed backdrop. Clicking it closes the popup. */}
      <button
        type="button"
        aria-label="Close"
        disabled={busy}
        onClick={onClose}
        className="absolute inset-0 bg-black/45"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="animate-up relative max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border border-c-bd bg-c-sf p-6 text-c-tx sm:max-w-md sm:rounded-3xl"
      >
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-medium">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-c-tx2">{subtitle}</p>}
          </div>
          <button
            type="button"
            aria-label="Close"
            disabled={busy}
            onClick={onClose}
            className="flex size-9 shrink-0 items-center justify-center rounded-[10px] text-c-tx2 hover:bg-c-sf2"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-5">{children}</div>
      </div>
    </div>,
    // The theme colors are variables defined on the ".console" wrapper, so draw inside it (not bare <body>).
    document.querySelector<HTMLElement>(".console") ?? document.body,
  );
}
