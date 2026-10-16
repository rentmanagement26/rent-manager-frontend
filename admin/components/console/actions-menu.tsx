"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { secondaryButtonClass } from "@/components/console/ui";

// One line in the menu: either a divider, or a clickable item with an icon.
export type MenuEntry =
  | "separator"
  | { label: string; icon: ReactNode; onSelect: () => void; danger?: boolean };

// The "Actions" dropdown shown on each row of a list (for example each staff member).
// It opens on click, and closes on a click outside, on Escape, or after an item is chosen.
export function ActionsMenu({ entries }: { entries: MenuEntry[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Only listen for outside clicks and Escape while the menu is open.
  useEffect(() => {
    if (!open) return;

    function onMouseDown(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((isOpen) => !isOpen)}
        className={`${secondaryButtonClass} flex h-8 items-center gap-1.5 px-3 text-xs`}
      >
        Actions <ChevronDown size={14} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-20 mt-1.5 w-56 rounded-[14px] border border-c-bd bg-c-sf p-1.5 shadow-(--c-sh)"
        >
          {entries.map((entry, index) =>
            entry === "separator" ? (
              <div key={index} className="mx-1.5 my-1.5 h-px bg-c-bd" />
            ) : (
              // The items have no border of their own: only a soft highlight on hover.
              <button
                key={entry.label}
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  entry.onSelect();
                }}
                className={`flex w-full items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-left text-[13px] transition ${
                  entry.danger ? "text-c-badt hover:bg-c-bad" : "text-c-tx hover:bg-c-sf2"
                }`}
              >
                <span className="flex size-4 items-center justify-center">{entry.icon}</span>
                {entry.label}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}
