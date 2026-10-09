import { Building2, CreditCard, House, LifeBuoy, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { CountUp } from "@/components/console/count-up";
import { Notice, OUTCOME_STYLE, Pill, cardClass } from "@/components/console/ui";
import { getAuditLogs, getAuditSettings } from "@/lib/audit-api";
import { requireAdmin } from "@/lib/auth-guard";
import { daysAgo, formatWhen } from "@/lib/format";
import type { ApiResult, AuditLogEntry, AuditSettings } from "@/lib/types";

export const metadata: Metadata = { title: "Overview" };

const FAILURE_SAMPLE_SIZE = 100;

const hoverCardClass = `${cardClass} transition-[transform,box-shadow,background-color,border-color] hover:-translate-y-0.5 hover:shadow-c-card`;

function CardTitle({ title, subtitle, aside }: { title: string; subtitle?: string; aside?: ReactNode }) {
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

function unavailableMessage(result: ApiResult<unknown>) {
  return result.status === "forbidden"
    ? "Your role doesn't have access to audit data."
    : "Couldn't load this right now. Refresh to try again.";
}

function mergeLatestFirst(...lists: AuditLogEntry[][]) {
  return lists.flat().sort((a, b) => b.id - a.id);
}

function LogRow({ entry }: { entry: AuditLogEntry }) {
  const outcome = OUTCOME_STYLE[entry.outcome] ?? OUTCOME_STYLE.Success;
  return (
    <div className="flex items-center gap-3 border-t border-c-bd py-3 first:border-t-0 first:pt-0">
      <span className="w-14 shrink-0 text-xs text-c-tx3">{formatWhen(entry.occurredAt)}</span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm">{entry.action}</div>
        <div className="truncate text-xs text-c-tx3">{entry.actorEmail ?? entry.ipAddress ?? "Unknown"}</div>
      </div>
      <Pill className={outcome.className}>{outcome.label}</Pill>
    </div>
  );
}

function HealthRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-t border-c-bd py-3 text-sm first:border-t-0 first:pt-0">
      <span>{label}</span>
      <span className="text-c-tx2">{value}</span>
    </div>
  );
}

const COMING_SOON = [
  { label: "Landlords", icon: Users },
  { label: "Tenants", icon: House },
  { label: "Properties", icon: Building2 },
  { label: "Billing", icon: CreditCard },
  { label: "Support", icon: LifeBuoy },
];

export default async function OverviewPage() {
  const session = await requireAdmin();
  const since = daysAgo(30);

  const [settings, failures, warnings, latest] = await Promise.all([
    getAuditSettings(session.backendToken),
    getAuditLogs(session.backendToken, { outcome: "Failure", from: since, limit: FAILURE_SAMPLE_SIZE }),
    getAuditLogs(session.backendToken, { outcome: "Warning", from: since, limit: FAILURE_SAMPLE_SIZE }),
    getAuditLogs(session.backendToken, { limit: 6 }),
  ]);

  // A dead token means every call says so; send them to sign in again (it also clears the cookie).
  if ([settings, failures, warnings, latest].some((result) => result.status === "expired")) {
    redirect("/session-expired");
  }

  const actions = settings.status === "ok" ? settings.data.actions : [];
  const eventsTotal = actions.reduce((sum, action) => sum + action.entriesLast30Days, 0);

  const failureItems =
    failures.status === "ok" && warnings.status === "ok" ? mergeLatestFirst(failures.data.items, warnings.data.items) : [];
  const failureCapped =
    failures.status === "ok" && warnings.status === "ok" && (!!failures.data.nextBeforeId || !!warnings.data.nextBeforeId);
  const failureCount = failureItems.length;

  return (
    <div className="flex flex-col gap-5">
      <div className="animate-up">
        <h1 className="text-2xl font-medium tracking-tight">Overview</h1>
        <p className="mt-1 text-c-tx2">How DomusPRO is doing over the last 30 days.</p>
      </div>

      <KpiRow
        settings={settings}
        eventsTotal={eventsTotal}
        failureCount={failureCount}
        failureCapped={failureCapped}
        failuresOk={failures.status === "ok" && warnings.status === "ok"}
      />

      <div className="grid animate-up gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]" style={{ animationDelay: "0.1s" }}>
        <ModulesCard settings={settings} />
        <HealthCard settings={settings} />
      </div>

      <div className="grid animate-up gap-4 lg:grid-cols-2" style={{ animationDelay: "0.15s" }}>
        <section className={cardClass}>
          <CardTitle title="Failures and warnings" subtitle="Last 30 days, most recent first" />
          {failures.status !== "ok" || warnings.status !== "ok" ? (
            <Notice>{unavailableMessage(failures.status !== "ok" ? failures : warnings)}</Notice>
          ) : failureItems.length === 0 ? (
            <Notice>No failures or warnings in the last 30 days.</Notice>
          ) : (
            failureItems.slice(0, 6).map((entry) => <LogRow key={entry.id} entry={entry} />)
          )}
        </section>
        <section className={cardClass}>
          <CardTitle title="Latest activity" subtitle="Most recent audit entries" />
          {latest.status !== "ok" ? (
            <Notice>{unavailableMessage(latest)}</Notice>
          ) : latest.data.items.length === 0 ? (
            <Notice>Nothing has been recorded yet.</Notice>
          ) : (
            latest.data.items.map((entry) => <LogRow key={entry.id} entry={entry} />)
          )}
        </section>
      </div>

      <section className={`${cardClass} animate-up`} style={{ animationDelay: "0.2s" }}>
        <CardTitle title="Coming next" subtitle="These sections need admin endpoints that don't exist yet." />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {COMING_SOON.map(({ label, icon: Icon }) => (
            <div key={label} className="flex items-center gap-3 rounded-xl bg-c-sf2 px-4 py-3.5 text-c-tx2">
              <Icon size={18} strokeWidth={1.75} />
              {label}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function KpiRow({
  settings,
  eventsTotal,
  failureCount,
  failureCapped,
  failuresOk,
}: {
  settings: ApiResult<AuditSettings>;
  eventsTotal: number;
  failureCount: number;
  failureCapped: boolean;
  failuresOk: boolean;
}) {
  const settingsOk = settings.status === "ok";
  const actions = settingsOk ? settings.data.actions : [];
  const modules = new Set(actions.map((action) => action.module)).size;
  const overrides = settingsOk ? settings.data.overrides : [];
  const offCount = overrides.filter((o) => o.mode === "Disabled").length;
  const summaryCount = overrides.filter((o) => o.mode === "Summary").length;
  const failurePercent = eventsTotal > 0 ? ((failureCount / eventsTotal) * 100).toFixed(1) : "0.0";

  const tiles: { label: string; value: ReactNode; note: ReactNode }[] = [
    {
      label: "Audited events",
      value: settingsOk ? <CountUp value={eventsTotal} /> : "—",
      note: <Pill className="bg-c-sf2 text-c-tx2">{settingsOk ? `${modules} modules` : "Unavailable"}</Pill>,
    },
    {
      label: "Failures and warnings",
      value: failuresOk ? (
        <>
          <CountUp value={failureCount} />
          {failureCapped ? "+" : ""}
        </>
      ) : (
        "—"
      ),
      note: (
        <Pill className="bg-c-bad text-c-badt">
          {failuresOk && settingsOk ? `${failurePercent}% of events` : "Unavailable"}
        </Pill>
      ),
    },
    {
      label: "Policy overrides",
      value: settingsOk ? <CountUp value={overrides.length} /> : "—",
      note: (
        <Pill className="bg-c-pu text-c-put">
          {settingsOk ? `${offCount} off · ${summaryCount} summary` : "Unavailable"}
        </Pill>
      ),
    },
    {
      label: "Actions audited",
      value: settingsOk ? <CountUp value={actions.filter((a) => a.mode !== "Disabled").length} /> : "—",
      note: <Pill className="bg-c-ok text-c-okt">{settingsOk ? `of ${actions.length} actions` : "Unavailable"}</Pill>,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {tiles.map((tile, index) => (
        <div key={tile.label} className={`${hoverCardClass} animate-up`} style={{ animationDelay: `${index * 0.05}s` }}>
          <p className="text-[13px] text-c-tx2">{tile.label}</p>
          <p className="my-2.5 text-[34px] font-medium tabular-nums tracking-tight">{tile.value}</p>
          {tile.note}
        </div>
      ))}
    </div>
  );
}

function ModulesCard({ settings }: { settings: ApiResult<AuditSettings> }) {
  if (settings.status !== "ok") {
    return (
      <section className={cardClass}>
        <CardTitle title="Events by module" subtitle="Last 30 days" />
        <Notice>{unavailableMessage(settings)}</Notice>
      </section>
    );
  }

  const totals = new Map<string, number>();
  for (const action of settings.data.actions) {
    totals.set(action.module, (totals.get(action.module) ?? 0) + action.entriesLast30Days);
  }
  const rows = [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 7);
  const max = Math.max(1, ...rows.map(([, count]) => count));

  return (
    <section className={cardClass}>
      <CardTitle title="Events by module" subtitle="Last 30 days" />
      <div className="flex flex-col gap-4">
        {rows.map(([name, count], index) => (
          <div key={name}>
            <div className="mb-1.5 flex justify-between text-[13px]">
              <span>{name}</span>
              <span className="tabular-nums text-c-tx2">{count.toLocaleString("en-CA")}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-[5px] bg-c-sf2">
              <div
                className="animate-grow-x h-full rounded-[5px] bg-c-ac"
                style={{ width: `${(count / max) * 100}%`, animationDelay: `${0.2 + index * 0.08}s` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function HealthCard({ settings }: { settings: ApiResult<AuditSettings> }) {
  if (settings.status !== "ok") {
    return (
      <section className={cardClass}>
        <CardTitle title="Auditing health" subtitle="Policy versus defaults" />
        <Notice>{unavailableMessage(settings)}</Notice>
      </section>
    );
  }

  const { actions, overrides } = settings.data;
  const atDefault = actions.filter((a) => a.mode === a.defaultMode).length;
  const off = actions.filter((a) => a.mode === "Disabled").length;
  const summary = actions.filter((a) => a.mode === "Summary").length;
  const protectedCount = actions.filter((a) => a.isProtected).length;
  const lastChange = overrides.map((o) => o.updatedAt).sort().at(-1);

  return (
    <section className={cardClass}>
      <CardTitle
        title="Auditing health"
        subtitle="Policy versus defaults"
        aside={
          <Link href="/audit-settings" className="text-[13px] text-c-act2 hover:underline">
            Manage
          </Link>
        }
      />
      <HealthRow label="Actions at default" value={`${atDefault} of ${actions.length}`} />
      <HealthRow label="Turned off" value={String(off)} />
      <HealthRow label="Summary only" value={String(summary)} />
      <HealthRow label="Protected" value={String(protectedCount)} />
      <HealthRow label="Last policy change" value={lastChange ? formatWhen(lastChange) : "Never"} />
    </section>
  );
}
