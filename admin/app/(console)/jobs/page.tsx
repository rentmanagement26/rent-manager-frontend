import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { JobsList } from "@/components/console/jobs-list";
import { Notice } from "@/components/console/ui";
import { requireAdmin } from "@/lib/auth-guard";
import { getJobs } from "@/lib/jobs-api";
import { getPermissions, PERMISSIONS } from "@/lib/permissions";

export const metadata: Metadata = { title: "Jobs" };

// Jobs: the background tasks DomusPRO runs on a schedule (applying plan changes, sending notices). SuperAdmin only.
export default async function JobsPage() {
  const session = await requireAdmin();

  const [jobs, { can }] = await Promise.all([getJobs(session.backendToken), getPermissions(session)]);
  if (jobs.status === "expired") redirect("/session-expired");

  return (
    <div className="flex max-w-4xl flex-col gap-5">
      <div className="animate-up">
        <h1 className="text-2xl font-medium tracking-tight">Jobs</h1>
        <p className="mt-1 text-c-tx2">Background tasks DomusPRO runs on a schedule.</p>
      </div>

      {jobs.status !== "ok" ? (
        <Notice>
          {jobs.status === "forbidden" ? "Only a SuperAdmin can see jobs." : "Couldn't load the jobs right now. Refresh to try again."}
        </Notice>
      ) : (
        <JobsList jobs={jobs.data} canRun={can(PERMISSIONS.jobsRun)} />
      )}
    </div>
  );
}
