import type { ReactNode } from "react";
import type { AuditOutcome } from "@/lib/types";

export const cardClass = "rounded-2xl border border-c-bd bg-c-sf p-6 transition-colors duration-400";

export const OUTCOME_STYLE: Record<AuditOutcome, { label: string; className: string }> = {
  Success: { label: "Success", className: "bg-c-ok text-c-okt" },
  Failure: { label: "Failed", className: "bg-c-bad text-c-badt" },
  Warning: { label: "Warning", className: "bg-c-wr text-c-wrt" },
};

export function Pill({ className, children }: { className: string; children: ReactNode }) {
  return <span className={`whitespace-nowrap rounded-[14px] px-2.5 py-0.75 text-xs font-medium ${className}`}>{children}</span>;
}

export function Notice({ children }: { children: ReactNode }) {
  return <p className="rounded-xl bg-c-sf2 px-4 py-3.5 text-[13px] text-c-tx2">{children}</p>;
}
