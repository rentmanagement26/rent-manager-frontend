"use server";

// Server actions for lease documents and signing. Client components call these; each answers { ok, data } or { error, expired }
// so a screen can show the backend's message instead of crashing. Page access is guarded by the pages; the backend checks every call as well.
import { SessionExpiredError } from "@/lib/api-error";
import { requireBackendToken } from "@/lib/auth-guard";
import * as api from "@/lib/document-api";
import { DocumentError } from "@/lib/document-api";
import type { SignOnlineInput, UploadTarget } from "@/lib/document-types";
import type { AppRole } from "@/lib/types";

export type ActionResult<T> = { ok: true; data: T } | { error: string; expired: boolean; code?: string };

const LANDLORD: AppRole[] = ["Admin", "Landlord"];
const TENANT: AppRole[] = ["Tenant"];
const BOTH: AppRole[] = ["Admin", "Landlord", "Tenant"];

// Signs in the caller for the allowed roles, runs the call and turns every outcome into an ActionResult.
async function run<T>(roles: AppRole[], work: (token: string) => Promise<T>): Promise<ActionResult<T>> {
  const session = await requireBackendToken(roles);
  try {
    return { ok: true, data: await work(session.backendToken) };
  } catch (err) {
    if (err instanceof SessionExpiredError) return { error: err.message, expired: true };
    if (err instanceof DocumentError) return { error: err.message, expired: false, code: err.code };
    return { error: "Something went wrong. Please try again.", expired: false };
  }
}

// --- Landlord ---

export async function leaseUploadUrlAction(tenancyId: number): Promise<ActionResult<UploadTarget>> {
  return run(LANDLORD, (token) => api.newLeaseUploadUrl(token, Number(tenancyId)));
}

export async function createLeaseDocumentAction(tenancyId: number, title: string, blobPath: string, fileName: string) {
  return run(LANDLORD, (token) => api.createDocument(token, Number(tenancyId), String(title).trim(), String(blobPath), String(fileName)));
}

export async function sendDocumentAction(id: number, expiresInDays: number | null) {
  return run(LANDLORD, (token) => api.sendDocument(token, Number(id), expiresInDays === null ? null : Number(expiresInDays)));
}

export async function remindSignersAction(id: number) {
  return run(LANDLORD, (token) => api.remindSigners(token, Number(id)));
}

export async function extendDocumentAction(id: number, days: number) {
  return run(LANDLORD, (token) => api.extendDocument(token, Number(id), Number(days)));
}

export async function withdrawDocumentAction(id: number) {
  return run(LANDLORD, (token) => api.withdrawDocument(token, Number(id)));
}

export async function acceptCopyAction(id: number, copyId: number) {
  return run(LANDLORD, (token) => api.acceptCopy(token, Number(id), Number(copyId)));
}

export async function rejectCopyAction(id: number, copyId: number, reason: string) {
  return run(LANDLORD, (token) => api.rejectCopy(token, Number(id), Number(copyId), String(reason).trim()));
}

export async function landlordPaperUploadUrlAction(id: number, extension: string): Promise<ActionResult<UploadTarget>> {
  return run(LANDLORD, (token) => api.landlordSignedUploadUrl(token, Number(id), String(extension)));
}

export async function landlordSignPaperAction(id: number, blobPath: string, fileName: string) {
  return run(LANDLORD, (token) => api.landlordSignPaper(token, Number(id), String(blobPath), String(fileName)));
}

// --- Landlord and tenant: signing online ---

export async function recordPagesViewedAction(id: number, pages: number[]) {
  return run(BOTH, (token) => api.recordPagesViewed(token, Number(id), pages.map(Number)));
}

export async function sendSigningCodeAction(id: number) {
  return run(BOTH, (token) => api.sendSigningCode(token, Number(id)));
}

export async function verifySigningCodeAction(id: number, code: string) {
  return run(BOTH, (token) => api.verifySigningCode(token, Number(id), String(code)));
}

export async function signOnlineAction(id: number, input: SignOnlineInput) {
  return run(BOTH, (token) => api.signOnline(token, Number(id), input));
}

// The stamped print copy address, for signing on paper (landlord, and the tenant once the lease has been sent).
export async function printCopyAction(id: number) {
  return run(BOTH, (token) => api.getPrintCopy(token, Number(id)));
}

// --- Tenant ---

export async function tenantPaperUploadUrlAction(id: number, extension: string): Promise<ActionResult<UploadTarget>> {
  return run(TENANT, (token) => api.tenantSignedUploadUrl(token, Number(id), String(extension)));
}

export async function uploadSignedCopyAction(id: number, blobPath: string, fileName: string, alsoCovers: number[]) {
  return run(TENANT, (token) => api.uploadSignedCopy(token, Number(id), String(blobPath), String(fileName), alsoCovers.map(Number)));
}

export async function declineDocumentAction(id: number, note: string) {
  return run(TENANT, (token) => api.declineDocument(token, Number(id), String(note)));
}
