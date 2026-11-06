// The contractor's jobs: the jobs of every landlord that invited them, the ones that need an answer first.
import Link from "next/link";
import { redirect } from "next/navigation";
import { TenantPageHeading } from "@/components/tenant-page-heading";
import { SessionExpiredError } from "@/lib/api-error";
import { requireBackendToken } from "@/lib/auth-guard";
import { listJobs } from "@/lib/contractor-portal-api";
import type { MyJobItem, MyJobList } from "@/lib/contractor-portal-types";
import { formatCalendarDate } from "@/lib/format-time";

const TABS = [
  { value: "open", label: "Open", count: (list: MyJobList) => list.openCount },
  { value: "finished", label: "Finished", count: (list: MyJobList) => list.finishedCount },
];

const STATUS_PILL: Record<string, string> = {
  Offered: "bg-amber-100 text-amber-900",
  Accepted: "bg-accent-tint text-accent-dark",
  Declined: "bg-red-100 text-red-800",
  Done: "bg-green-100 text-green-800",
  Cancelled: "bg-subtle text-body",
};

// What to say beside the status: the visit, the parts, or when it was offered.
function detail(job: MyJobItem): string {
  if (job.waitingForParts) return `Parts expected ${job.partsExpectedBy ? formatCalendarDate(job.partsExpectedBy) : "soon"}`;
  if (job.visitDate) return `Visit ${formatCalendarDate(job.visitDate)}${job.visitWindow ? `, ${job.visitWindow.toLowerCase()}` : ""}`;
  return `Offered ${formatCalendarDate(job.offeredAt)}`;
}

export default async function ContractorJobsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const active = TABS.find((tab) => tab.value === status) ?? TABS[0];
  const session = await requireBackendToken(["Contractor"]);

  let list: MyJobList;
  try {
    list = await listJobs(session.backendToken, active.value);
  } catch (err) {
    if (err instanceof SessionExpiredError) redirect("/session-expired");
    return <p className="rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">Couldn&apos;t load your jobs. Refresh to try again.</p>;
  }

  return (
    <div>
      <TenantPageHeading title="My jobs" description="Jobs from every landlord that invited you. The ones that need your answer come first." />

      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <Link
            key={tab.value}
            href={`/contractor/jobs?status=${tab.value}`}
            className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${tab.value === active.value ? "border-heading bg-heading text-white" : "border-default bg-white text-heading hover:bg-subtle"}`}
          >
            {tab.label} {tab.count(list)}
          </Link>
        ))}
      </div>

      {list.items.length === 0 ? (
        <div className="max-w-2xl rounded-2xl border border-default bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-medium text-heading">{active.value === "open" ? "No open jobs" : "No finished jobs"}</p>
          <p className="mt-1 text-sm text-muted">{active.value === "open" ? "When a landlord offers you a job it shows up here and you are told." : "Jobs you finish or decline show up here."}</p>
        </div>
      ) : (
        <ul className="max-w-4xl space-y-3">
          {list.items.map((job) => (
            <li key={job.id}>
              <Link href={`/contractor/jobs/${job.id}`} className={`flex items-center gap-4 rounded-2xl border bg-white p-4 shadow-sm hover:border-accent ${job.needsAnswer ? "border-orange-200" : "border-default"}`}>
                <span className="w-20 shrink-0 text-sm font-semibold text-heading">{job.number}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-heading">{job.title}</p>
                  <p className="truncate text-xs text-muted">{job.placeLabel} · {job.landlordName} · {detail(job)}</p>
                </div>
                {job.urgency === "Emergency" && <span className="shrink-0 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-800">Emergency</span>}
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${job.needsAnswer ? "bg-amber-100 text-amber-900" : STATUS_PILL[job.status]}`}>
                  {job.needsAnswer ? "Needs your answer" : job.status}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
