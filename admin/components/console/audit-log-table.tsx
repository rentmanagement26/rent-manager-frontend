"use client";

import { Download } from "lucide-react";
import { useState } from "react";
import { OUTCOME_STYLE, Pill } from "@/components/console/ui";
import { formatWhen } from "@/lib/format";
import type { AuditLogEntry } from "@/lib/types";

function initials(email: string | null) {
  return email ? email.slice(0, 2).toUpperCase() : "?";
}

// Spreadsheet apps run cells starting with these as formulas, so the export defuses them.
function csvCell(value: string | number | null) {
  let text = value === null ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

function exportCsv(entries: AuditLogEntry[]) {
  const header = ["Time (UTC)", "User", "Roles", "Module", "Action", "Outcome", "Entity", "IP address", "Source", "Summary"];
  const rows = entries.map((e) =>
    [
      e.occurredAt,
      e.actorEmail,
      e.actorRoles,
      e.module,
      e.action,
      e.outcome,
      [e.entityType, e.entityId].filter(Boolean).join(" "),
      e.ipAddress,
      e.source,
      e.summary,
    ]
      .map(csvCell)
      .join(","),
  );
  const blob = new Blob([[header.map(csvCell).join(","), ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function prettyChanges(changes: string) {
  try {
    return JSON.stringify(JSON.parse(changes), null, 2);
  } catch {
    return changes;
  }
}

function DetailItem({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="min-w-0">
      <div className="text-xs text-c-tx2">{label}</div>
      <div className="mt-0.75 truncate text-sm font-medium text-c-tx">{value || "—"}</div>
    </div>
  );
}

export function AuditLogTable({ entries, canSeeChanges }: { entries: AuditLogEntry[]; canSeeChanges: boolean }) {
  const [selectedId, setSelectedId] = useState<number | null>(entries[0]?.id ?? null);
  const selected = entries.find((e) => e.id === selectedId) ?? entries[0];

  if (entries.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="mb-2 flex justify-end">
        <button
          type="button"
          onClick={() => exportCsv(entries)}
          className="flex h-9.5 items-center gap-1.5 rounded-[10px] border border-c-ac bg-c-ac px-4 text-[13px] font-medium text-c-act transition hover:brightness-105 active:scale-[0.96]"
        >
          <Download size={16} />
          Export page
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-170 border-collapse">
          <thead>
            <tr>
              {["User", "Action", "Time", "Status"].map((heading) => (
                <th key={heading} className="px-2.5 pb-3 text-left text-xs font-normal text-c-tx3">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => {
              const outcome = OUTCOME_STYLE[entry.outcome] ?? OUTCOME_STYLE.Success;
              const isSelected = entry.id === selected?.id;
              return (
                <tr
                  key={entry.id}
                  tabIndex={0}
                  aria-selected={isSelected}
                  onClick={() => setSelectedId(entry.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedId(entry.id);
                    }
                  }}
                  className={`group cursor-pointer outline-none ${isSelected ? "[&>td]:bg-c-aci" : "hover:[&>td]:bg-c-sf2"} focus-visible:[&>td]:bg-c-sf2`}
                >
                  <td className="h-14.5 rounded-l-[10px] border-t border-c-bd px-2.5">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-c-aci text-xs font-medium text-c-act2">
                        {initials(entry.actorEmail)}
                      </div>
                      <div className="min-w-0">
                        <div className="max-w-56 truncate text-sm">{entry.actorEmail ?? "Unknown"}</div>
                        <div className="truncate text-xs text-c-tx3">{entry.actorRoles || entry.ipAddress || "No role"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="border-t border-c-bd px-2.5 text-sm">{entry.action}</td>
                  <td className="whitespace-nowrap border-t border-c-bd px-2.5 text-sm" title={entry.occurredAt}>
                    {formatWhen(entry.occurredAt)}
                  </td>
                  <td className="rounded-r-[10px] border-t border-c-bd px-2.5">
                    <Pill className={outcome.className}>{outcome.label}</Pill>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="animate-up mt-4 rounded-xl bg-c-sf2 p-5" key={selected.id}>
          <p className="mb-4 text-sm">{selected.summary}</p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <DetailItem label="Request ID" value={selected.requestId} />
            <DetailItem label="IP address" value={selected.ipAddress} />
            <DetailItem label="Source" value={selected.source} />
            <DetailItem label="Module" value={selected.module} />
            <DetailItem label="Entity" value={[selected.entityType, selected.entityId].filter(Boolean).join(" ")} />
          </div>
          {selected.changes &&
            (canSeeChanges ? (
              <pre className="mt-4 max-h-60 overflow-auto rounded-lg bg-c-sf p-3 text-xs text-c-tx2">
                {prettyChanges(selected.changes)}
              </pre>
            ) : (
              <p className="mt-4 text-xs text-c-tx3">The recorded changes are visible to SuperAdmin only.</p>
            ))}
        </div>
      )}
    </div>
  );
}
