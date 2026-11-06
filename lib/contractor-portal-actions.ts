"use server";

// Server actions for the contractor's own screens. A contractor with an account is signed in; a contractor on the email link holds only the
// secret token (the page passes it in). Each answers { ok, data } or { error, expired } so a screen can show the backend's message.
import * as api from "@/lib/contractor-portal-api";
import type { QuoteInput } from "@/lib/contractor-portal-types";
import type { JobUpdateInput } from "@/lib/contractor-types";
import type { ActionResult } from "@/lib/document-actions";
import { runMaintenance, runPublicMaintenance } from "@/lib/maintenance-call";
import type { UploadTarget } from "@/lib/maintenance-types";

// A contractor's calls: signed in as a contractor, every outcome turned into an ActionResult.
const run = <T>(work: (token: string) => Promise<T>) => runMaintenance(["Contractor"], work);

const id = (value: number) => Number(value);
const kindOf = (kind: string): "jobs" | "quotes" => (kind === "quotes" ? "quotes" : "jobs");

// What a quote form sends, cleaned: whole cents, a tax word, a trimmed note, and a day or nothing.
function quoteInput(input: QuoteInput): QuoteInput {
  return {
    amountCents: Math.round(Number(input.amountCents)),
    taxMode: String(input.taxMode).toLowerCase(),
    note: input.note ? String(input.note).trim() || null : null,
    validUntil: input.validUntil || null,
  };
}

// --- A contractor with an account ---

export async function jobUpdateAction(jobId: number, update: JobUpdateInput) {
  return run((token) => api.postJobUpdate(token, id(jobId), update));
}

export async function submitQuoteAsContractorAction(quoteId: number, input: QuoteInput) {
  return run((token) => api.submitMyQuote(token, id(quoteId), quoteInput(input)));
}

export async function declineQuoteAsContractorAction(quoteId: number, reason: string) {
  return run((token) => api.declineMyQuote(token, id(quoteId), String(reason).trim()));
}

export async function contractorFileUrlAction(kind: string, targetId: number, extension: string): Promise<ActionResult<UploadTarget>> {
  return run((token) => api.fileUploadUrl(token, kindOf(kind), id(targetId), String(extension)));
}

export async function contractorRegisterFileAction(kind: string, targetId: number, blobPath: string, fileName: string) {
  return run((token) => api.registerFile(token, kindOf(kind), id(targetId), String(blobPath), String(fileName)));
}

export async function contractorRemoveFileAction(kind: string, targetId: number, fileId: number) {
  return run((token) => api.removeFile(token, kindOf(kind), id(targetId), id(fileId)));
}

export async function acceptInvitationAction(inviteToken: string) {
  return run((token) => api.acceptInvitation(token, String(inviteToken)));
}

// --- The no-account email link ---

export async function linkUpdateAction(linkToken: string, update: JobUpdateInput) {
  return runPublicMaintenance(() => api.postLinkUpdate(String(linkToken), update));
}

export async function linkSubmitQuoteAction(linkToken: string, input: QuoteInput) {
  return runPublicMaintenance(() => api.submitLinkQuote(String(linkToken), quoteInput(input)));
}

export async function linkDeclineQuoteAction(linkToken: string, reason: string) {
  return runPublicMaintenance(() => api.declineLinkQuote(String(linkToken), String(reason).trim()));
}

export async function linkFileUrlAction(linkToken: string, extension: string): Promise<ActionResult<UploadTarget>> {
  return runPublicMaintenance(() => api.linkFileUploadUrl(String(linkToken), String(extension)));
}

export async function linkRegisterFileAction(linkToken: string, blobPath: string, fileName: string) {
  return runPublicMaintenance(() => api.registerLinkFile(String(linkToken), String(blobPath), String(fileName)));
}

export async function linkRemoveFileAction(linkToken: string, fileId: number) {
  return runPublicMaintenance(() => api.removeLinkFile(String(linkToken), id(fileId)));
}
