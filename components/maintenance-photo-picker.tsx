"use client";

// Lets the tenant choose up to 8 photos (and one video) for a request, with small previews and a remove button on each.
// The files are only chosen here; they are uploaded after the request is sent (see lib/maintenance-upload.ts).
import { useEffect, useMemo, useRef, useState } from "react";
import { ACCEPT, MAX_FILES, fileProblem, isVideo } from "@/lib/maintenance-upload";

export function PhotoPicker({ files, onChange, disabled }: { files: File[]; onChange: (files: File[]) => void; disabled?: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");

  // Preview addresses for the chosen files; freed when the list changes.
  const previews = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files]);
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  // Adds every file that passes the checks and says why the others were left out.
  function addFiles(list: FileList | null) {
    if (!list) return;
    const next = [...files];
    let problem = "";
    for (const file of Array.from(list)) {
      const why = fileProblem(file, next);
      if (why) problem = why;
      else next.push(file);
    }
    setError(problem);
    onChange(next);
    if (input.current) input.current.value = "";
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {files.map((file, index) => (
          <div key={`${file.name}-${index}`} className="relative h-16 w-20 overflow-hidden rounded-lg bg-subtle">
            {isVideo(file) ? (
              <span className="flex h-full items-center justify-center text-xs font-medium text-body">Video</span>
            ) : (
              // A local preview of a file the person just picked: next/image has nothing to optimise here.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previews[index]} alt={file.name} className="h-full w-full object-cover" />
            )}
            <button
              type="button"
              disabled={disabled}
              aria-label={`Remove ${file.name}`}
              onClick={() => onChange(files.filter((_, i) => i !== index))}
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white"
            >
              ×
            </button>
          </div>
        ))}
        {files.length < MAX_FILES && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => input.current?.click()}
            className="flex h-16 w-20 items-center justify-center rounded-lg border border-dashed border-muted text-sm font-medium text-accent hover:bg-accent-tint disabled:opacity-50"
          >
            + Add
          </button>
        )}
      </div>
      <input ref={input} type="file" accept={ACCEPT} multiple className="hidden" onChange={(event) => addFiles(event.target.files)} />
      <p className="mt-2 text-xs text-muted">
        Up to {MAX_FILES} files, one of them a video (about 20 seconds). Your landlord and the people they send to fix it can see them, so keep other people and
        papers out of the picture.
      </p>
      {error && <p className="mt-1 text-xs font-medium text-red-700">{error}</p>}
    </div>
  );
}
