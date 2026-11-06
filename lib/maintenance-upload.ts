// Browser-side helpers for photos and videos on a request: check a file before upload, and run the three upload steps
// (get an address, PUT the file to storage, register it).
import type { ActionResult } from "@/lib/document-actions";
import { putToStorage } from "@/lib/document-format";
import { landlordMediaUploadUrlAction, landlordRegisterMediaAction } from "@/lib/landlord-maintenance-actions";
import { mediaUploadUrlAction, registerMediaAction } from "@/lib/maintenance-actions";
import type { UploadTarget } from "@/lib/maintenance-types";
import { goToSessionExpired } from "@/lib/session-expired-client";

export const MAX_FILES = 8;
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
export const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const VIDEO_TYPES = ["video/mp4", "video/quicktime"];
// What the file picker offers.
export const ACCEPT = [...PHOTO_TYPES, ...VIDEO_TYPES].join(",");

export const isVideo = (file: File) => VIDEO_TYPES.includes(file.type);

// A sentence saying why `file` cannot be added to the files already chosen, or "" when it can. The server checks again.
export function fileProblem(file: File, chosen: File[]): string {
  if (!isVideo(file) && !PHOTO_TYPES.includes(file.type)) return `${file.name}: use a JPEG, PNG or WebP photo, or an MP4 or MOV video.`;
  if (chosen.length >= MAX_FILES) return `You can add up to ${MAX_FILES} files.`;
  if (isVideo(file) && chosen.some(isVideo)) return "Only one video can be added.";
  if (file.size > (isVideo(file) ? MAX_VIDEO_BYTES : MAX_PHOTO_BYTES)) return `${file.name} is too large. A photo can be at most 10 MB and a video 50 MB.`;
  return "";
}

// The two server calls an upload needs, already tied to what the file belongs to (a request, a job, a quote or a link).
export interface Uploader {
  getUrl: (extension: string) => Promise<ActionResult<UploadTarget>>;
  register: (blobPath: string, fileName: string) => Promise<ActionResult<unknown>>;
}

// Uploads each file, one after the other. Returns "" when all arrived, or a sentence saying which one failed.
export async function uploadFiles(files: File[], uploader: Uploader): Promise<string> {
  for (const file of files) {
    const extension = file.name.includes(".") ? file.name.split(".").pop()! : "";
    const target = await uploader.getUrl(extension);
    if (!("ok" in target)) {
      if (target.expired) goToSessionExpired();
      return `${file.name}: ${target.error}`;
    }

    try {
      await putToStorage(target.data.uploadUrl, file);
    } catch (err) {
      return `${file.name}: ${err instanceof Error ? err.message : "The file could not be uploaded."}`;
    }

    const registered = await uploader.register(target.data.blobPath, file.name);
    if (!("ok" in registered)) return `${file.name}: ${registered.error}`;
  }
  return "";
}

// The photos of a maintenance request, by the tenant or by the landlord (their backend paths differ).
export type RequestUploader = "tenant" | "landlord";

export function uploadRequestFiles(requestId: number, files: File[], by: RequestUploader = "tenant"): Promise<string> {
  const landlord = by === "landlord";
  return uploadFiles(files, {
    getUrl: (extension) => (landlord ? landlordMediaUploadUrlAction : mediaUploadUrlAction)(requestId, extension),
    register: (blobPath, fileName) => (landlord ? landlordRegisterMediaAction : registerMediaAction)(requestId, blobPath, fileName),
  });
}

// What a contractor may attach: photos and one video to a job (10 files), or a PDF and photos to a written quote (3 files, no video).
export type WorkFileKind = "job" | "quote";

export const WORK_FILE_LIMITS: Record<WorkFileKind, { max: number; video: boolean; pdf: boolean }> = {
  job: { max: 10, video: true, pdf: false },
  quote: { max: 3, video: false, pdf: true },
};

// What the file picker offers for a job or a quote.
export const workFileAccept = (kind: WorkFileKind) =>
  [...PHOTO_TYPES, ...(WORK_FILE_LIMITS[kind].video ? VIDEO_TYPES : []), ...(WORK_FILE_LIMITS[kind].pdf ? ["application/pdf"] : [])].join(",");

// A sentence saying why `file` cannot be added to a job or quote that already has `count` files (`hasVideo`: one of them is a video),
// or "" when it can. The server checks again.
export function workFileProblem(file: File, kind: WorkFileKind, count: number, hasVideo: boolean): string {
  const limits = WORK_FILE_LIMITS[kind];
  const video = isVideo(file);
  const pdf = file.type === "application/pdf";
  const allowed = PHOTO_TYPES.includes(file.type) || (video && limits.video) || (pdf && limits.pdf);
  if (!allowed) return `${file.name}: ${kind === "job" ? "use a JPEG, PNG or WebP photo, or an MP4 or MOV video." : "use a PDF, or a JPEG, PNG or WebP photo."}`;
  if (count >= limits.max) return `You can add up to ${limits.max} files.`;
  if (video && hasVideo) return "Only one video can be added.";
  if (file.size > (video ? MAX_VIDEO_BYTES : MAX_PHOTO_BYTES)) return `${file.name} is too large. A photo or PDF can be at most 10 MB and a video 50 MB.`;
  return "";
}
