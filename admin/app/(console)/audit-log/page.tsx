import { ListFilter } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuditLogTable } from "@/components/console/audit-log-table";
import { Notice, cardClass } from "@/components/console/ui";
import { getAuditLogs, getAuditSettings } from "@/lib/audit-api";
import { requireAdmin } from "@/lib/auth-guard";
import type { AuditOutcome } from "@/lib/types";

export const metadata: Metadata = { title: "Audit log" };

const PAGE_SIZE = 25;

const TABS = [
  { key: "all", label: "All" },
  { key: "failed", label: "Failed" },
  { key: "admin", label: "Admin" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

const OUTCOMES: AuditOutcome[] = ["Success", "Failure", "Warning"];
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

interface SearchParams {
  tab?: string;
  module?: string;
  outcome?: string;
  from?: string;
  to?: string;
  before?: string;
}

function parseTab(value: string | undefined): TabKey {
  return TABS.some((tab) => tab.key === value) ? (value as TabKey) : "all";
}

function parseDate(value: string | undefined, endOfDay: boolean) {
  if (!value || !DATE_PATTERN.test(value)) return undefined;
  const date = new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

// Builds a link that keeps the current filters. Passing null removes a key.
function hrefWith(params: SearchParams, changes: Partial<Record<keyof SearchParams, string | null>>) {
  const next = new URLSearchParams();
  const merged: Record<string, string | null | undefined> = { ...params, ...changes };
  for (const [key, value] of Object.entries(merged)) {
    if (value) next.set(key, value);
  }
  const query = next.toString();
  return query ? `/audit-log?${query}` : "/audit-log";
}

const fieldClass =
  "h-9.5 w-full rounded-[10px] border border-c-bd bg-c-bg px-3 text-sm text-c-tx outline-none focus:border-c-ac";

export default async function AuditLogPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await requireAdmin();
  const params = await searchParams;

  const tab = parseTab(params.tab);
  const outcome = OUTCOMES.find((o) => o === params.outcome);
  const beforeId = Number(params.before) > 0 ? Number(params.before) : undefined;

  const [logs, settings] = await Promise.all([
    getAuditLogs(session.backendToken, {
      // The Failed tab always means failures; otherwise the Filter panel's outcome applies.
      outcome: tab === "failed" ? "Failure" : outcome,
      source: tab === "admin" ? "admin" : undefined,
      module: params.module || undefined,
      from: parseDate(params.from, false),
      to: parseDate(params.to, true),
      beforeId,
      limit: PAGE_SIZE,
    }),
    getAuditSettings(session.backendToken),
  ]);

  if (logs.status === "expired" || settings.status === "expired") {
    redirect("/session-expired");
  }

  const modules = settings.status === "ok" ? [...new Set(settings.data.actions.map((a) => a.module))].sort() : [];
  const activeIndex = TABS.findIndex((t) => t.key === tab);
  const filtersActive = !!(params.module || outcome || params.from || params.to);

  return (
    <div className="flex flex-col gap-5">
      <div className="animate-up">
        <h1 className="text-2xl font-medium tracking-tight">Audit log</h1>
        <p className="mt-1 text-c-tx2">Every recorded action on the platform.</p>
      </div>

      <section className={`${cardClass} animate-up`} style={{ animationDelay: "0.06s" }}>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <nav aria-label="Audit log views" className="relative grid w-64 grid-cols-3 rounded-[10px] bg-c-sf2 p-0.75">
            <div
              aria-hidden
              className="absolute inset-y-0.75 left-0.75 w-[calc((100%-6px)/3)] rounded-lg bg-c-sf transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{ transform: `translateX(${activeIndex * 100}%)` }}
            />
            {TABS.map((t) => (
              <Link
                key={t.key}
                href={hrefWith(params, { tab: t.key === "all" ? null : t.key, before: null })}
                aria-current={t.key === tab ? "page" : undefined}
                className={`relative z-10 rounded-lg py-1.5 text-center text-[13px] ${t.key === tab ? "font-medium text-c-tx" : "text-c-tx2 hover:text-c-tx"}`}
              >
                {t.label}
              </Link>
            ))}
          </nav>

          <details className="group relative" open={filtersActive}>
            <summary className="flex h-9.5 cursor-pointer list-none items-center gap-1.5 rounded-[10px] border border-c-bd2 px-4 text-[13px] transition hover:bg-c-sf2 [&::-webkit-details-marker]:hidden">
              <ListFilter size={16} />
              Filter{filtersActive ? " (on)" : ""}
            </summary>
            <form
              method="get"
              action="/audit-log"
              className="mt-3 grid min-w-[min(20rem,calc(100vw-4rem))] gap-3 rounded-xl border border-c-bd bg-c-sf p-4 shadow-c-card sm:absolute sm:right-0 sm:z-20 sm:w-80"
            >
              {tab !== "all" && <input type="hidden" name="tab" value={tab} />}
              <label className="grid gap-1.5 text-xs text-c-tx2">
                Module
                <select name="module" defaultValue={params.module ?? ""} className={fieldClass}>
                  <option value="">All modules</option>
                  {modules.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1.5 text-xs text-c-tx2">
                Status
                <select
                  name="outcome"
                  defaultValue={outcome ?? ""}
                  disabled={tab === "failed"}
                  className={`${fieldClass} disabled:opacity-50`}
                >
                  <option value="">Any status</option>
                  {OUTCOMES.map((o) => (
                    <option key={o} value={o}>
                      {o === "Failure" ? "Failed" : o}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-1.5 text-xs text-c-tx2">
                  From
                  <input type="date" name="from" defaultValue={params.from ?? ""} className={fieldClass} />
                </label>
                <label className="grid gap-1.5 text-xs text-c-tx2">
                  To
                  <input type="date" name="to" defaultValue={params.to ?? ""} className={fieldClass} />
                </label>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="h-9.5 flex-1 rounded-[10px] bg-c-ac text-[13px] font-medium text-c-act transition hover:brightness-105 active:scale-[0.97]"
                >
                  Apply
                </button>
                <Link
                  href={hrefWith({ tab: params.tab }, {})}
                  className="flex h-9.5 items-center rounded-[10px] border border-c-bd2 px-4 text-[13px] hover:bg-c-sf2"
                >
                  Clear
                </Link>
              </div>
            </form>
          </details>
        </div>

        {logs.status !== "ok" ? (
          <Notice>
            {logs.status === "forbidden"
              ? "Your role doesn't have access to the audit log."
              : "Couldn't load the audit log right now. Refresh to try again."}
          </Notice>
        ) : logs.data.items.length === 0 ? (
          <Notice>
            {filtersActive || tab !== "all" ? "No entries match these filters." : "Nothing has been recorded yet."}
          </Notice>
        ) : (
          <>
            {/* Keyed so selection resets whenever the page of results changes. */}
            <AuditLogTable
              key={logs.data.items[0].id}
              entries={logs.data.items}
              canSeeChanges={session.role === "SuperAdmin"}
            />
            <div className="mt-5 flex items-center justify-between text-[13px] text-c-tx2">
              <span>Showing {logs.data.items.length} entries, newest first</span>
              <div className="flex gap-2">
                {beforeId && (
                  <Link
                    href={hrefWith(params, { before: null })}
                    className="rounded-[10px] border border-c-bd2 px-4 py-2 hover:bg-c-sf2"
                  >
                    Back to newest
                  </Link>
                )}
                {logs.data.nextBeforeId && (
                  <Link
                    href={hrefWith(params, { before: String(logs.data.nextBeforeId) })}
                    className="rounded-[10px] border border-c-bd2 px-4 py-2 hover:bg-c-sf2"
                  >
                    Older entries
                  </Link>
                )}
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
