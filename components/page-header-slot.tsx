"use client";

import { usePageHeaderValue } from "@/lib/page-header-context";

export function PageHeaderSlot() {
  const header = usePageHeaderValue();
  if (!header) return null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{header.title}</h1>
        <p className="text-sm text-slate-500 mt-1">{header.description}</p>
      </div>
      {header.action && <div className="flex items-center gap-3">{header.action}</div>}
    </div>
  );
}