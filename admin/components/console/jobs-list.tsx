"use client";

// The list on the Jobs page: each job with its schedule, last result, Run now and a History popup of its recent runs.
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Modal } from "@/components/console/modal";
import { ErrorBox, Pill, cardClass, goToSessionExpired, primaryButtonClass, secondaryButtonClass } from "@/components/console/ui";
import { formatWhen } from "@/lib/format";
import { loadJobRunsAction, runJobAction } from "@/lib/jobs-actions";
import type { AdminJob, AdminJobRun } from "@/lib/types";

// Pill for how a run went. The backend names the status; anything unknown is shown as it came.
function runPill(status: string) {
  if (status === "Succeeded" || status === "Success") return "bg-c-ok text-c-okt";
  if (status === "Failed") return "bg-c-bad text-c-badt";
  return "bg-c-sf2 text-c-tx2";
}

// "5 h", "12 min" until a job is next due, or "due now" when the time has passed.
function nextDue(job: AdminJob) {
  if (job.isRunning) return "running now";
  if (!job.nextDueAt) return "not scheduled";
  const minutes = Math.round((new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(job.nextDueAt) ? job.nextDueAt : `${job.nextDueAt}Z`).getTime() - Date.now()) / 60000);
  if (minutes <= 0) return "due now";
  return minutes < 90 ? `next due in ${minutes} min` : `next due in ${Math.round(minutes / 60)} h`;
}

export function JobsList({ jobs, canRun }: { jobs: AdminJob[]; canRun: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  // The job whose history is open, and its runs (null while loading).
  const [history, setHistory] = useState<{ job: AdminJob; runs: AdminJobRun[] | null; error: string } | null>(null);

  async function run(job: AdminJob) {
    setBusy(job.name);
    setNotice("");
    setError("");
    const result = await runJobAction(job.name);
    setBusy(null);

    if ("error" in result) {
      if (result.expired) return goToSessionExpired();
      setError(result.error);
      return;
    }
    setNotice(`${job.description} will run in a moment. Open History to see how it went.`);
    router.refresh();
  }

  async function openHistory(job: AdminJob) {
    setHistory({ job, runs: null, error: "" });
    const result = await loadJobRunsAction(job.name);
    if ("error" in result) {
      if (result.expired) return goToSessionExpired();
      setHistory({ job, runs: [], error: result.error });
      return;
    }
    setHistory({ job, runs: result.data, error: "" });
  }

  return (
    <section className={`${cardClass} animate-up`}>
      {notice && <p className="mb-3 rounded-[10px] bg-c-ok px-3 py-2.5 text-[13px] text-c-okt">{notice}</p>}
      <ErrorBox message={error} />

      <ul className="flex flex-col">
        {jobs.map((job) => {
          const last = job.lastRun;
          return (
            <li key={job.name} className="flex flex-wrap items-center justify-between gap-3 border-t border-c-bd py-4 first:border-t-0 first:pt-0">
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                  {job.description}
                  {last ? (
                    <Pill className={runPill(last.status)}>{last.status === "Failed" ? "Last run failed" : `Last run ${last.status.toLowerCase()}`}</Pill>
                  ) : (
                    <Pill className="bg-c-sf2 text-c-tx2">Not run yet</Pill>
                  )}
                  {job.isRunning && <Pill className="bg-c-aci text-c-act2">Running</Pill>}
                </p>
                <p className="mt-1 text-xs text-c-tx2">
                  {job.schedule} · {nextDue(job)}
                  {last && ` · last run ${formatWhen(last.startedAt)}`}
                  {last?.summary && ` · ${last.summary}`}
                </p>
                {last?.error && <p className="mt-1 text-xs text-c-badt">{last.error}</p>}
                <p className="mt-0.5 font-mono text-[11px] text-c-tx3">{job.name}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => openHistory(job)} className={`${secondaryButtonClass} h-9`}>
                  History
                </button>
                {canRun && (
                  <button type="button" onClick={() => run(job)} disabled={busy !== null || job.isRunning} className={`${primaryButtonClass} h-9`}>
                    {busy === job.name ? "Asking…" : "Run now"}
                  </button>
                )}
              </div>
            </li>
          );
        })}
        {jobs.length === 0 && <li className="text-[13px] text-c-tx3">No jobs are registered.</li>}
      </ul>

      {history && (
        <Modal title="Job history" subtitle={history.job.description} onClose={() => setHistory(null)}>
          <div className="flex flex-col gap-3">
            {history.runs === null && <p className="text-[13px] text-c-tx2">Loading…</p>}
            <ErrorBox message={history.error} />
            {history.runs && history.runs.length === 0 && !history.error && <p className="text-[13px] text-c-tx2">This job has not run yet.</p>}
            {history.runs?.map((r) => (
              <div key={r.id} className="border-t border-c-bd pt-3 first:border-t-0 first:pt-0">
                <p className="flex items-center gap-2 text-[13px]">
                  <Pill className={runPill(r.status)}>{r.status}</Pill>
                  <span>{formatWhen(r.startedAt)}</span>
                  <span className="text-c-tx3">{r.trigger}</span>
                </p>
                {r.summary && <p className="mt-1 text-xs text-c-tx2">{r.summary}</p>}
                {r.error && <p className="mt-1 text-xs text-c-badt">{r.error}</p>}
              </div>
            ))}
            <div className="flex justify-end">
              <button type="button" onClick={() => setHistory(null)} className={secondaryButtonClass}>
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
}
