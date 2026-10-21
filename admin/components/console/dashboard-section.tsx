// The top of the Overview: landlord numbers, landlords by plan, new landlords per week, customers by role and the admin team.
// All from GET /admin/dashboard. The backend leaves out the customers and staff sections when the admin may not see them,
// so a missing section simply isn't drawn.
import Link from "next/link";
import { CountUp } from "@/components/console/count-up";
import { CardTitle, Notice, Pill, cardClass, hoverCardClass } from "@/components/console/ui";
import type { AdminDashboard, ApiResult } from "@/lib/types";

// "Oct 19". Week starts are dates, so they are shown in UTC to avoid sliding to the day before.
function shortDate(value: string) {
  const date = new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(value) ? value : `${value}Z`);
  return date.toLocaleDateString("en-CA", { timeZone: "UTC", month: "short", day: "numeric" });
}

// One line of a small list card: label on the left, value on the right.
function Line({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-t border-c-bd py-3 text-sm first:border-t-0 first:pt-0">
      <span>{label}</span>
      <span className="text-c-tx2">{children}</span>
    </div>
  );
}

export function DashboardSection({ result }: { result: ApiResult<AdminDashboard> }) {
  if (result.status !== "ok") {
    return (
      <section className={`${cardClass} animate-up`}>
        <CardTitle title="Landlords and customers" />
        <Notice>
          {result.status === "forbidden"
            ? "Your role doesn't have access to landlord numbers."
            : "Couldn't load the landlord numbers right now. Refresh to try again."}
        </Notice>
      </section>
    );
  }

  const { landlords, customers, staff } = result.data;
  const tiles = [
    { label: "Landlords", value: landlords.total, note: <Pill className="bg-c-ok text-c-okt">{landlords.active} active</Pill> },
    {
      label: "New this week",
      value: landlords.newThisWeek,
      note: <Pill className="bg-c-aci text-c-act2">since {shortDate(landlords.weekStartsAt)}</Pill>,
    },
    { label: "Switched off", value: landlords.switchedOff, note: <Pill className="bg-c-sf2 text-c-tx2">of {landlords.total}</Pill> },
    {
      label: "No plan yet",
      value: landlords.noPlan,
      note: <Pill className="bg-c-wr text-c-wrt">get the default plan on first use</Pill>,
    },
  ];

  const maxPlan = Math.max(1, ...landlords.byPlan.map((p) => p.landlords));
  const maxWeek = Math.max(1, ...landlords.newPerWeek.map((w) => w.count));

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map((tile, index) => (
          <div key={tile.label} className={`${hoverCardClass} animate-up`} style={{ animationDelay: `${index * 0.05}s` }}>
            <p className="text-[13px] text-c-tx2">{tile.label}</p>
            <p className="my-2.5 text-[34px] font-medium tabular-nums tracking-tight">
              <CountUp value={tile.value} />
            </p>
            {tile.note}
          </div>
        ))}
      </div>

      <div className="grid animate-up gap-4 lg:grid-cols-2" style={{ animationDelay: "0.1s" }}>
        <section className={cardClass}>
          <CardTitle
            title="Landlords by plan"
            subtitle="Who is on which plan"
            aside={
              <Link href="/landlords" className="text-[13px] text-c-act2 hover:underline">
                View landlords
              </Link>
            }
          />
          <div className="flex flex-col gap-4">
            {landlords.byPlan.map((plan) => (
              <div key={plan.packageId}>
                <div className="mb-1.5 flex items-center justify-between text-[13px]">
                  <span>
                    {plan.name}
                    {!plan.isActive && <span className="ml-2 text-xs text-c-tx3">switched off</span>}
                  </span>
                  <span className="flex items-center gap-2 tabular-nums text-c-tx2">
                    {plan.onOlderVersion > 0 && <Pill className="bg-c-pu text-c-put">{plan.onOlderVersion} on older terms</Pill>}
                    {plan.landlords}
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-[5px] bg-c-sf2">
                  <div className="h-full rounded-[5px] bg-c-ac" style={{ width: `${(plan.landlords / maxPlan) * 100}%` }} />
                </div>
              </div>
            ))}
            <div className="flex justify-between text-[13px] text-c-tx2">
              <span>No plan</span>
              <span className="tabular-nums">{landlords.noPlan}</span>
            </div>
          </div>
        </section>

        <section className={cardClass}>
          <CardTitle title="New landlords per week" subtitle={`Last ${landlords.newPerWeek.length} weeks`} />
          <div className="flex h-24 items-end gap-2">
            {landlords.newPerWeek.map((week) => (
              <div
                key={week.weekStart}
                title={`Week of ${shortDate(week.weekStart)}: ${week.count}`}
                className="min-h-[3px] flex-1 rounded-t-[5px] bg-c-ac"
                style={{ height: `${(week.count / maxWeek) * 100}%` }}
              />
            ))}
          </div>
          {landlords.newPerWeek.length > 0 && (
            <div className="mt-2 flex justify-between text-xs text-c-tx3">
              <span>{shortDate(landlords.newPerWeek[0].weekStart)}</span>
              <span>{shortDate(landlords.newPerWeek[landlords.newPerWeek.length - 1].weekStart)}</span>
            </div>
          )}
        </section>
      </div>

      {(customers || staff) && (
        <div className="grid animate-up gap-4 lg:grid-cols-2" style={{ animationDelay: "0.15s" }}>
          {customers && (
            <section className={cardClass}>
              <CardTitle
                title="Customers by role"
                aside={
                  <Link href="/customers" className="text-[13px] text-c-act2 hover:underline">
                    Open customers
                  </Link>
                }
              />
              {customers.roles.map((role) => (
                <Line key={role.role} label={`${role.role}s`}>
                  {role.total} · {role.active} active
                  {role.switchedOff > 0 && ` · ${role.switchedOff} switched off`}
                </Line>
              ))}
            </section>
          )}
          {staff && (
            <section className={cardClass}>
              <CardTitle title="Admin team" subtitle="SuperAdmin only" />
              <Line label="Active">{staff.active}</Line>
              <Line label="Switched off">{staff.switchedOff}</Line>
              <Line label="Temporary password not used yet">
                {staff.temporaryPasswordPending > 0 ? <Pill className="bg-c-wr text-c-wrt">{staff.temporaryPasswordPending}</Pill> : 0}
              </Line>
              <Line label="Authenticator not set up">{staff.authenticatorNotSetUp}</Line>
            </section>
          )}
        </div>
      )}
    </>
  );
}
