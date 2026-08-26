"use client";

import { useSidebar } from "@/lib/sidebar-context";

export function MenuToggleButton() {
  const { setOpen } = useSidebar();

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="shrink-0 rounded-lg border border-slate-200 bg-white p-2 shadow-sm lg:hidden"
      aria-label="Open menu"
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
  );
}