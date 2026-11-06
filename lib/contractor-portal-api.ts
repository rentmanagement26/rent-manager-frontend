// Backend calls for the contractor's own screens: the jobs and quote requests of a contractor with an account, accepting an invitation, and the
// no-account email link. Used only on the server (pages and server actions).
import type { JobUpdateInput } from "@/lib/contractor-types";
import type { Invitation, LinkPage, MyJob, MyJobList, MyQuote, MyQuoteList, QuoteInput } from "@/lib/contractor-portal-types";
import { maintenanceCall, orNull, publicMaintenanceCall } from "@/lib/maintenance-call";
import type { UploadTarget } from "@/lib/maintenance-types";

const BASE = "/api/v1/contractor";

const call = <T>(token: string, method: string, path: string, body?: unknown) => maintenanceCall<T>(token, method, `${BASE}${path}`, body);
const publicCall = <T>(method: string, path: string, body?: unknown) => publicMaintenanceCall<T>(method, `${BASE}${path}`, body);

// --- Jobs and quotes, for a contractor with an account ---

// status: open (the default: offered or accepted), finished, or all.
export function listJobs(token: string, status: string) {
  return call<MyJobList>(token, "GET", `/jobs?status=${encodeURIComponent(status)}`);
}

export function getJob(token: string, id: number): Promise<MyJob | null> {
  return orNull(call<MyJob>(token, "GET", `/jobs/${id}`));
}

export function postJobUpdate(token: string, id: number, update: JobUpdateInput) {
  return call<MyJob>(token, "POST", `/jobs/${id}/updates`, update);
}

// status: open (the default: asked or sent), closed, or all.
export function listQuotes(token: string, status: string) {
  return call<MyQuoteList>(token, "GET", `/quotes?status=${encodeURIComponent(status)}`);
}

export function getQuote(token: string, id: number): Promise<MyQuote | null> {
  return orNull(call<MyQuote>(token, "GET", `/quotes/${id}`));
}

export function submitMyQuote(token: string, id: number, input: QuoteInput) {
  return call<MyQuote>(token, "POST", `/quotes/${id}/submit`, input);
}

export function declineMyQuote(token: string, id: number, reason: string) {
  return call<MyQuote>(token, "POST", `/quotes/${id}/decline`, { Reason: reason || null });
}

// Photos and video of the work (a job) or the written quote (a quote): get an address, PUT the file there, then register it.
export function fileUploadUrl(token: string, kind: "jobs" | "quotes", id: number, extension: string): Promise<UploadTarget> {
  return call(token, "POST", `/${kind}/${id}/files/upload-url`, { Extension: extension });
}

export function registerFile(token: string, kind: "jobs" | "quotes", id: number, blobPath: string, fileName: string) {
  return call<unknown>(token, "POST", `/${kind}/${id}/files`, { BlobPath: blobPath, FileName: fileName });
}

export function removeFile(token: string, kind: "jobs" | "quotes", id: number, fileId: number) {
  return call<unknown>(token, "DELETE", `/${kind}/${id}/files/${fileId}`);
}

// --- Invitation ---

// Open to anyone with the token. Null for an unknown or used token.
export function getInvitation(inviteToken: string): Promise<Invitation | null> {
  return orNull(publicCall<Invitation>("GET", `/invitations/${encodeURIComponent(inviteToken)}`));
}

// Needs a signed-in contractor: links their account to the entry on the landlord's list.
export function acceptInvitation(token: string, inviteToken: string) {
  return call<{ landlordName: string; contractorName: string }>(token, "POST", "/invitations/accept", { Token: inviteToken });
}

// --- The no-account email link: no sign-in, the secret is the token in the address ---

// Throws a MaintenanceError: 404 (not valid) or 410 (expired, with a message naming the landlord).
export function getLink(linkToken: string) {
  return publicCall<LinkPage>("GET", `/links/${encodeURIComponent(linkToken)}`);
}

export function postLinkUpdate(linkToken: string, update: JobUpdateInput) {
  return publicCall<LinkPage>("POST", `/links/${encodeURIComponent(linkToken)}/updates`, update);
}

export function submitLinkQuote(linkToken: string, input: QuoteInput) {
  return publicCall<LinkPage>("POST", `/links/${encodeURIComponent(linkToken)}/submit`, input);
}

export function declineLinkQuote(linkToken: string, reason: string) {
  return publicCall<LinkPage>("POST", `/links/${encodeURIComponent(linkToken)}/decline`, { Reason: reason || null });
}

export function linkFileUploadUrl(linkToken: string, extension: string): Promise<UploadTarget> {
  return publicCall("POST", `/links/${encodeURIComponent(linkToken)}/files/upload-url`, { Extension: extension });
}

export function registerLinkFile(linkToken: string, blobPath: string, fileName: string) {
  return publicCall<LinkPage>("POST", `/links/${encodeURIComponent(linkToken)}/files`, { BlobPath: blobPath, FileName: fileName });
}

export function removeLinkFile(linkToken: string, fileId: number) {
  return publicCall<LinkPage>("DELETE", `/links/${encodeURIComponent(linkToken)}/files/${fileId}`);
}
