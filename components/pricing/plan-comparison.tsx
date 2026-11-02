"use client";

// "Compare all features": a bar that opens the full feature table (closed until the visitor opens it). Groups, rows and values come
// from lib/pricing-content.ts. Columns are Basic, Pro and Max; the Pro column is lightly tinted.
import { useState } from "react";
import { Icon } from "@/components/pricing/icons";
import { FEATURE_GROUPS } from "@/lib/pricing-content";
import type { Cell } from "@/lib/pricing-content";

const COLUMNS = ["Basic", "Pro", "Max"];

// A tick in a green circle, a soft dash, or the text itself.
function CellView({ value }: { value: Cell }) {
  if (value === true) {
    return (
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-green-tint text-brand-green" aria-label="Included">
        <Icon name="check" className="h-3 w-3" />
      </span>
    );
  }
  if (value === false) return <span className="font-normal text-[#c5c8d4]" aria-label="Not included">&ndash;</span>;
  return <>{value}</>;
}

export function PlanComparison() {
  const [open, setOpen] = useState(false);

  return (
    <section>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 rounded-[18px] border border-subtle bg-white px-5 py-4 text-left hover:border-accent"
      >
        <span className="font-head text-base font-extrabold text-heading">
          Compare all features
          <span className="mt-0.5 block text-[12.5px] font-medium text-muted">See everything each plan includes</span>
        </span>
        <span className={`flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full bg-accent-tint text-accent transition-transform ${open ? "rotate-180" : ""}`}>
          <Icon name="chevronDown" className="h-[18px] w-[18px]" />
        </span>
      </button>

      {open && (
        <div className="mt-3 overflow-hidden rounded-[22px] border border-subtle bg-white">
          <div className="overflow-x-auto">
            <div className="min-w-[560px] text-[13.5px] text-heading">
              <div className="grid grid-cols-[minmax(170px,1.6fr)_repeat(3,1fr)] items-center font-bold">
                <div />
                {COLUMNS.map((name) => (
                  <div key={name} className={`py-4 text-center text-sm ${name === "Pro" ? "bg-[#fdf6f0] text-accent-dark" : ""}`}>{name}</div>
                ))}
              </div>

              {FEATURE_GROUPS.map((group) => (
                <div key={group.title}>
                  <div className="flex items-center gap-2.5 border-t border-[#eef0f4] bg-bg px-3.5 py-3 text-xs font-extrabold uppercase tracking-[0.06em] text-body">
                    <span className={`flex h-6 w-6 items-center justify-center rounded-lg ${group.icon === "sparkles" ? "bg-accent text-white" : "bg-accent-tint text-accent"}`}>
                      <Icon name={group.icon} className="h-3.5 w-3.5" />
                    </span>
                    {group.title}
                  </div>
                  {group.rows.map((row) => (
                    <div key={row.label} className="grid grid-cols-[minmax(170px,1.6fr)_repeat(3,1fr)] items-center border-t border-[#eef0f4]">
                      <div className="px-3.5 py-3">
                        {row.label}
                        {row.comingSoon && <span className="ml-1.5 rounded-full bg-accent-tint px-2 py-0.5 text-[10.5px] font-bold text-accent-dark">Coming soon</span>}
                      </div>
                      {row.values.map((value, index) => (
                        <div key={COLUMNS[index]} className={`px-3.5 py-3 text-center font-semibold ${index === 1 ? "bg-[#fdf6f0]" : ""}`}>
                          <CellView value={value} />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
