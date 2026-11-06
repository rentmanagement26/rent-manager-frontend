"use server";

// Server actions for the tenant's maintenance requests. Client components call these; each answers { ok, data } or { error, expired }
// so a screen can show the backend's message instead of crashing. The backend checks every call as well.
import type { ActionResult } from "@/lib/document-actions";
import * as api from "@/lib/maintenance-api";
import { runMaintenance } from "@/lib/maintenance-call";
import type { ReportInput, SimilarRequest, UploadTarget } from "@/lib/maintenance-types";

// The tenant's calls: signed in as a tenant, every outcome turned into an ActionResult.
const run = <T>(work: (token: string) => Promise<T>) => runMaintenance(["Tenant"], work);

export async function similarRequestsAction(tenancyId: number, category: string, location: string, commonArea: string | null): Promise<ActionResult<SimilarRequest[]>> {
  return run((token) => api.findSimilar(token, Number(tenancyId), String(category), String(location), commonArea ? String(commonArea) : null));
}

export async function reportProblemAction(input: ReportInput) {
  return run((token) => api.reportProblem(token, input));
}

export async function addCommentAction(id: number, body: string) {
  return run((token) => api.addComment(token, Number(id), String(body).trim()));
}

export async function cancelRequestAction(id: number, reason: string) {
  return run((token) => api.cancelRequest(token, Number(id), String(reason).trim()));
}

export async function reopenRequestAction(id: number, reason: string) {
  return run((token) => api.reopenRequest(token, Number(id), String(reason).trim()));
}

export async function mediaUploadUrlAction(id: number, extension: string): Promise<ActionResult<UploadTarget>> {
  return run((token) => api.mediaUploadUrl(token, Number(id), String(extension)));
}

export async function registerMediaAction(id: number, blobPath: string, fileName: string) {
  return run((token) => api.registerMedia(token, Number(id), String(blobPath), String(fileName)));
}
