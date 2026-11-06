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

// The two server calls an upload needs. The tenant and the landlord have their own, because the backend paths differ.
export interface Uploader {
  getUrl: (requestId: number, extension: string) => Promise<ActionResult<UploadTarget>>;
  register: (requestId: number, blobPath: string, fileName: string) => Promise<ActionResult<unknown>>;
}

export const TENANT_UPLOADER: Uploader = { getUrl: mediaUploadUrlAction, register: registerMediaAction };
export const LANDLORD_UPLOADER: Uploader = { getUrl: landlordMediaUploadUrlAction, register: landlordRegisterMediaAction };

// Uploads each file to the request, one after the other. Returns "" when all arrived, or a sentence saying which one failed.
export async function uploadRequestFiles(requestId: number, files: File[], uploader: Uploader = TENANT_UPLOADER): Promise<string> {
  for (const file of files) {
    const extension = file.name.includes(".") ? file.name.split(".").pop()! : "";
    const target = await uploader.getUrl(requestId, extension);
    if (!("ok" in target)) {
      if (target.expired) goToSessionExpired();
      return `${file.name}: ${target.error}`;
    }

    try {
      await putToStorage(target.data.uploadUrl, file);
    } catch (err) {
      return `${file.name}: ${err instanceof Error ? err.message : "The file could not be uploaded."}`;
    }

    const registered = await uploader.register(requestId, target.data.blobPath, file.name);
    if (!("ok" in registered)) return `${file.name}: ${registered.error}`;
  }
  return "";
}
