// One job for a contractor with an account. The job body is shared with the no-account email link; here the calls are tied to the job's id.
import { notFound, redirect } from "next/navigation";
import { ContractorJobView } from "@/components/contractor-job-view";
import { SessionExpiredError } from "@/lib/api-error";
import { requireBackendToken } from "@/lib/auth-guard";
import { contractorFileUrlAction, contractorRegisterFileAction, contractorRemoveFileAction, jobUpdateAction } from "@/lib/contractor-portal-actions";
import { getJob } from "@/lib/contractor-portal-api";
import type { MyJob } from "@/lib/contractor-portal-types";

export default async function ContractorJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const session = await requireBackendToken(["Contractor"]);

  let job: MyJob | null;
  try {
    job = await getJob(session.backendToken, Number(id));
  } catch (err) {
    if (err instanceof SessionExpiredError) redirect("/session-expired");
    return <p className="rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">Couldn&apos;t load this job. Refresh to try again.</p>;
  }
  if (!job) notFound();

  return (
    <ContractorJobView
      job={job}
      onUpdate={jobUpdateAction.bind(null, job.id)}
      files={{
        getUrl: contractorFileUrlAction.bind(null, "jobs", job.id),
        register: contractorRegisterFileAction.bind(null, "jobs", job.id),
        remove: contractorRemoveFileAction.bind(null, "jobs", job.id),
      }}
    />
  );
}
