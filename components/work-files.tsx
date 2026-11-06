"use client";

// The files a contractor attached to a job (photos and a video of the work) or to a quote (a PDF or photos of the written quote): a list with
// a remove button on the ones they may remove, and an "Add" button. Files are uploaded straight to storage, then registered; the page then reloads.
// Only the landlord and that contractor see them. The calls are passed in already tied to the job, quote or email link.
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useRunner } from "@/components/maintenance-request-actions";
import type { ActionResult } from "@/lib/document-actions";
import type { WorkFile } from "@/lib/contractor-portal-types";
import type { UploadTarget } from "@/lib/maintenance-types";
import { type WorkFileKind, uploadFiles, workFileAccept, workFileProblem } from "@/lib/maintenance-upload";

export interface WorkFileCalls {
  getUrl: (extension: string) => Promise<ActionResult<UploadTarget>>;
  register: (blobPath: string, fileName: string) => Promise<ActionResult<unknown>>;
  remove: (fileId: number) => Promise<ActionResult<unknown>>;
}

const smallButton = "rounded-full border border-default bg-white px-3.5 py-1.5 text-sm font-semibold text-heading hover:bg-subtle disabled:cursor-not-allowed disabled:opacity-50";

export function WorkFiles({ files, kind, canAdd, calls }: { files: WorkFile[]; kind: WorkFileKind; canAdd: boolean; calls: WorkFileCalls }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const remover = useRunner();

  // Checks each chosen file, uploads the good ones one after the other, and reloads the page.
  async function add(list: FileList | null) {
    if (!list) return;
    const chosen: File[] = [];
    let problem = "";
    let hasVideo = files.some((file) => file.kind === "Video");
    for (const file of Array.from(list)) {
      const why = workFileProblem(file, kind, files.length + chosen.length, hasVideo);
      if (why) problem = why;
      else {
        chosen.push(file);
        hasVideo = hasVideo || file.type.startsWith("video/");
      }
    }
    if (input.current) input.current.value = "";
    setError(problem);
    if (chosen.length === 0) return;

    setBusy(true);
    const failed = await uploadFiles(chosen, { getUrl: calls.getUrl, register: calls.register });
    setBusy(false);
    if (failed) setError(failed);
    router.refresh();
  }

  return (
    <div>
      {files.length > 0 && (
        <ul className="mb-3 flex flex-wrap gap-2">
          {files.map((file) => (
            <li key={file.id} className="relative">
              {file.kind === "Photo" ? (
                <a href={file.url} target="_blank" rel="noreferrer" title={file.fileName}>
                  {/* A short-lived signed storage link, so next/image cannot optimise it. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={file.url} alt={file.fileName} className="h-20 w-24 rounded-lg object-cover" />
                </a>
              ) : (
                <a href={file.url} target="_blank" rel="noreferrer" className="flex h-20 w-24 flex-col items-center justify-center rounded-lg border border-default bg-bg px-2 text-center text-xs text-heading hover:border-accent">
                  <span className="font-semibold">{file.kind === "Video" ? "Video" : "PDF"}</span>
                  <span className="w-full truncate text-muted">{file.fileName}</span>
                </a>
              )}
              {file.canRemove && (
                <button
                  type="button"
                  aria-label={`Remove ${file.fileName}`}
                  disabled={remover.busy}
                  onClick={() => remover.run(() => calls.remove(file.id))}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white"
                >
                  ×
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {files.length === 0 && !canAdd && <p className="text-sm text-muted">No files.</p>}

      {canAdd && (
        <>
          <button type="button" disabled={busy} onClick={() => input.current?.click()} className={smallButton}>
            {busy ? "Uploading…" : kind === "job" ? "+ Add photos or a video" : "+ Attach a file"}
          </button>
          <input ref={input} type="file" accept={workFileAccept(kind)} multiple className="hidden" onChange={(event) => add(event.target.files)} />
          <p className="mt-2 text-xs text-muted">
            {kind === "job" ? "Up to 10 files, one of them a video. The tenant does not see these." : "A PDF or photos of your written quote, up to 3 files. Only the landlord sees them."}
          </p>
        </>
      )}
      {(error || remover.error) && <p role="alert" className="mt-2 text-sm font-medium text-red-700">{error || remover.error}</p>}
    </div>
  );
}
