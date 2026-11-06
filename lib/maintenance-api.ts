// Backend calls for the tenant's maintenance requests. Used only on the server (pages and server actions).
import { maintenanceCall, orNull } from "@/lib/maintenance-call";
import type { ReportForm, ReportInput, RequestDetail, RequestListItem, SimilarRequest, UploadTarget } from "@/lib/maintenance-types";

const BASE = "/api/v1/tenants/me/maintenance-requests";

// The tenant calls all start with the same path.
const call = <T>(token: string, method: string, path: string, body?: unknown) => maintenanceCall<T>(token, method, `${BASE}${path}`, body);

export function getReportForm(token: string, tenancyId: number): Promise<ReportForm | null> {
  return orNull(call<ReportForm>(token, "GET", `/form?tenancyId=${tenancyId}`));
}

// Open requests for the same place and category. Only a suggestion for the form.
export function findSimilar(token: string, tenancyId: number, category: string, location: string, commonArea: string | null) {
  const query = new URLSearchParams({ tenancyId: String(tenancyId), category, location });
  if (commonArea) query.set("commonArea", commonArea);
  return call<SimilarRequest[]>(token, "GET", `/similar?${query}`);
}

export function reportProblem(token: string, input: ReportInput) {
  return call<{ id: number; number: string }>(token, "POST", "", input);
}

// All of the tenant's requests, newest activity first (the backend returns at most 200).
export function listMyRequests(token: string) {
  return call<RequestListItem[]>(token, "GET", "");
}

export function getMyRequest(token: string, id: number): Promise<RequestDetail | null> {
  return orNull(call<RequestDetail>(token, "GET", `/${id}`));
}

export function addComment(token: string, id: number, body: string) {
  return call<{ id: number }>(token, "POST", `/${id}/comments`, { Body: body });
}

export function cancelRequest(token: string, id: number, reason: string) {
  return call<null>(token, "POST", `/${id}/cancel`, { Reason: reason });
}

export function reopenRequest(token: string, id: number, reason: string) {
  return call<null>(token, "POST", `/${id}/reopen`, { Reason: reason });
}

// Photo and video upload is three steps: get an address, PUT the file there from the browser, then register it.
export function mediaUploadUrl(token: string, id: number, extension: string): Promise<UploadTarget> {
  return call(token, "POST", `/${id}/media/upload-url`, { Extension: extension });
}

export function registerMedia(token: string, id: number, blobPath: string, fileName: string) {
  return call<{ id: number; kind: string }>(token, "POST", `/${id}/media`, { BlobPath: blobPath, FileName: fileName });
}
