// Backend calls for lease documents and signing, for both the landlord and the tenant. Used only on the server.
import { backendFetch } from "@/lib/api-client";
import { SessionExpiredError } from "@/lib/api-error";
import type {
  DocumentDownload,
  DocumentListItem,
  LeaseDocument,
  SignOnlineInput,
  SigningStatus,
  UploadTarget,
} from "@/lib/document-types";

// Thrown when the backend refuses; the message is safe to show and the code (such as "wrong_state") says why.
export class DocumentError extends Error {
  constructor(message: string, readonly code: string, readonly status: number) {
    super(message);
  }
}

// Sends a request and gives back the JSON answer (null for an empty answer). A dead session becomes SessionExpiredError.
async function call<T>(token: string, method: string, path: string, body?: unknown): Promise<T> {
  const response = await backendFetch(`/api/v1${path}`, token, {
    method,
    cache: "no-store",
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (response.status === 401) throw new SessionExpiredError();

  if (!response.ok) {
    let message = "Something went wrong. Please try again.";
    let code = "error";
    try {
      const data = (await response.json()) as { message?: string; code?: string };
      if (data.message) message = data.message;
      if (data.code) code = data.code;
    } catch {
      // Not JSON: keep the generic message.
    }
    if (response.status === 429) message = "Too many tries. Wait a minute and try again.";
    throw new DocumentError(message, code, response.status);
  }

  const text = await response.text();
  return (text ? JSON.parse(text) : null) as T;
}

// --- Reading ---

export async function getDocument(token: string, id: number): Promise<LeaseDocument | null> {
  try {
    return await call<LeaseDocument>(token, "GET", `/documents/${id}`);
  } catch (err) {
    if (err instanceof DocumentError && err.status === 404) return null;
    throw err;
  }
}

// The landlord's documents for one lease, or the documents sent to the signed-in tenant.
export async function listDocuments(token: string, tenancyId?: number): Promise<DocumentListItem[]> {
  const query = tenancyId ? `?tenancyId=${tenancyId}&pageSize=50` : "?pageSize=50";
  const page = await call<{ items: DocumentListItem[] }>(token, "GET", `/documents${query}`);
  return page.items;
}

// Short-lived (10 minute) addresses for the files the caller may open.
export async function getDownloads(token: string, id: number): Promise<DocumentDownload[]> {
  return (await call<DocumentDownload[] | null>(token, "GET", `/documents/${id}/downloads`)) ?? [];
}

export async function getSigningStatus(token: string, id: number): Promise<SigningStatus | null> {
  try {
    return await call<SigningStatus>(token, "GET", `/documents/${id}/signing-status`);
  } catch (err) {
    if (err instanceof DocumentError && err.status === 404) return null;
    throw err;
  }
}

// --- Landlord: create, sign, send and manage ---

export function newLeaseUploadUrl(token: string, tenancyId: number): Promise<UploadTarget> {
  return call(token, "POST", `/tenancies/${tenancyId}/documents/upload-url`, { Extension: "pdf" });
}

export function createDocument(token: string, tenancyId: number, title: string, blobPath: string, fileName: string) {
  return call<{ documentId: number; publicCode: string; version: number; pageCount: number }>(token, "POST", `/tenancies/${tenancyId}/documents`, {
    Title: title,
    BlobPath: blobPath,
    FileName: fileName,
  });
}

export function sendDocument(token: string, id: number, expiresInDays: number | null) {
  return call<unknown>(token, "POST", `/documents/${id}/send`, { ExpiresInDays: expiresInDays });
}

export function remindSigners(token: string, id: number) {
  return call<{ reminded: number }>(token, "POST", `/documents/${id}/remind`);
}

export function extendDocument(token: string, id: number, days: number) {
  return call<unknown>(token, "POST", `/documents/${id}/extend`, { Days: days });
}

export function withdrawDocument(token: string, id: number) {
  return call<unknown>(token, "POST", `/documents/${id}/withdraw`);
}

export function acceptCopy(token: string, id: number, copyId: number) {
  return call<unknown>(token, "POST", `/documents/${id}/signed-copies/${copyId}/accept`);
}

export function rejectCopy(token: string, id: number, copyId: number, reason: string) {
  return call<unknown>(token, "POST", `/documents/${id}/signed-copies/${copyId}/reject`, { Reason: reason });
}

export function landlordSignedUploadUrl(token: string, id: number, extension: string): Promise<UploadTarget> {
  return call(token, "POST", `/documents/${id}/landlord-signed-copy/upload-url`, { Extension: extension });
}

// The landlord's paper signature: registers the scan they uploaded. It is accepted at once.
export function landlordSignPaper(token: string, id: number, blobPath: string, fileName: string) {
  return call<unknown>(token, "POST", `/documents/${id}/landlord-sign`, { BlobPath: blobPath, FileName: fileName });
}

// --- Landlord and tenant: signing online ---

export function recordPagesViewed(token: string, id: number, pages: number[]) {
  return call<{ viewed: number; total: number; allViewed: boolean }>(token, "POST", `/documents/${id}/pages-viewed`, { Pages: pages });
}

export function sendSigningCode(token: string, id: number) {
  return call<{ sentTo: string; expiresAt: string; resendAfterSeconds: number }>(token, "POST", `/documents/${id}/signing-code`);
}

export function verifySigningCode(token: string, id: number, code: string) {
  return call<{ signBy: string }>(token, "POST", `/documents/${id}/signing-code/verify`, { Code: code });
}

export function signOnline(token: string, id: number, input: SignOnlineInput) {
  return call<{ signedAt: string; documentCompleted: boolean; status: string }>(token, "POST", `/documents/${id}/sign-online`, {
    Version: input.version,
    ConsentVersion: input.consentVersion,
    Consent: true,
    GivenNames: input.givenNames,
    Surname: input.surname,
    Signature: input.signature
      ? { Width: input.signature.width, Height: input.signature.height, Strokes: input.signature.strokes.map((s) => s.map((p) => ({ X: p.x, Y: p.y }))) }
      : null,
  });
}

// --- Tenant: paper signing and declining ---

export function tenantSignedUploadUrl(token: string, id: number, extension: string): Promise<UploadTarget> {
  return call(token, "POST", `/documents/${id}/signed-copy/upload-url`, { Extension: extension });
}

export function uploadSignedCopy(token: string, id: number, blobPath: string, fileName: string, alsoCovers: number[]) {
  return call<unknown>(token, "POST", `/documents/${id}/signed-copy`, { BlobPath: blobPath, FileName: fileName, Confirmed: true, AlsoCovers: alsoCovers });
}

export function declineDocument(token: string, id: number, note: string) {
  return call<unknown>(token, "POST", `/documents/${id}/decline`, { Note: note.trim() === "" ? null : note.trim() });
}

// The stamped print copy for signing on paper. Answers a short-lived download address.
export function getPrintCopy(token: string, id: number) {
  return call<{ fileName: string; downloadUrl: string }>(token, "GET", `/documents/${id}/print-copy`);
}
