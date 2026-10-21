import type { ReactNode } from "react";
import type { AuditOutcome } from "@/lib/types";

export const cardClass = "rounded-2xl border border-c-bd bg-c-sf p-6 transition-colors duration-400";

// A card that lifts slightly on hover; used for the number tiles on the Overview.
export const hoverCardClass = `${cardClass} transition-[transform,box-shadow,background-color,border-color] hover:-translate-y-0.5 hover:shadow-c-card`;

// Title (and optional subtitle and right-hand link) at the top of an Overview card.
export function CardTitle({ title, subtitle, aside }: { title: string; subtitle?: string; aside?: ReactNode }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h2 className="text-base font-medium">{title}</h2>
        {subtitle && <p className="mt-0.75 text-[13px] text-c-tx2">{subtitle}</p>}
      </div>
      {aside}
    </div>
  );
}

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

export const inputClass =
  "h-10.5 w-full rounded-[10px] border border-c-bd2 bg-c-bg px-3.5 text-sm text-c-tx outline-none transition placeholder:text-c-tx3 focus:border-c-ac";

export const primaryButtonClass =
  "h-10 rounded-[10px] bg-c-ac px-4 text-[13px] font-medium text-c-act transition hover:brightness-105 active:scale-[0.97] disabled:opacity-60";

export const secondaryButtonClass =
  "h-10 rounded-[10px] border border-c-bd2 px-4 text-[13px] text-c-tx transition hover:bg-c-sf2 active:scale-[0.97]";

export function ErrorBox({ message }: { message: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-[10px] bg-c-bad px-3 py-2.5 text-[13px] text-c-badt">
      {message}
    </p>
  );
}

export function WarningBox({ children }: { children: ReactNode }) {
  return <p className="rounded-[10px] bg-c-wr px-3 py-2.5 text-[13px] text-c-wrt">{children}</p>;
}

// Hard navigation on purpose: /session-expired is a route handler that clears the dead session cookie.
export function goToSessionExpired() {
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.assign("/session-expired");
}
