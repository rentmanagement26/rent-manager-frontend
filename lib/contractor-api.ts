// Backend calls for the landlord's contractors, jobs and quotes. Used only on the server (pages and server actions).
import type { ContractorDetail, ContractorInput, ContractorList, JobUpdateInput } from "@/lib/contractor-types";
import { maintenanceCall, orNull } from "@/lib/maintenance-call";

const BASE = "/api/v1/maintenance";

// The landlord's maintenance calls all start with the same path.
const call = <T>(token: string, method: string, path: string, body?: unknown) => maintenanceCall<T>(token, method, `${BASE}${path}`, body);

// --- The contractor list ---

// status: active (default), inactive or all. With a category, contractors of that trade come first and the preferred one on top.
export function listContractors(token: string, filters: { status?: string; category?: string; q?: string } = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) if (value) query.set(key, value);
  return call<ContractorList>(token, "GET", `/contractors?${query}`);
}

export function getContractor(token: string, id: number): Promise<ContractorDetail | null> {
  return orNull(call<ContractorDetail>(token, "GET", `/contractors/${id}`));
}

export function createContractor(token: string, input: ContractorInput) {
  return call<ContractorDetail>(token, "POST", "/contractors", input);
}

export function updateContractor(token: string, id: number, input: ContractorInput) {
  return call<ContractorDetail>(token, "PUT", `/contractors/${id}`, input);
}

export function setContractorActive(token: string, id: number, active: boolean) {
  return call<null>(token, "POST", `/contractors/${id}/${active ? "reactivate" : "deactivate"}`);
}

// Invites the contractor to DomusPRO by email, or sends it again (the old link stops working).
export function inviteContractor(token: string, id: number) {
  return call<unknown>(token, "POST", `/contractors/${id}/invite`);
}

export function deleteContractor(token: string, id: number) {
  return call<null>(token, "DELETE", `/contractors/${id}`);
}

// --- Jobs ---

export function assignJob(token: string, requestId: number, input: { contractorId: number; instructions: string | null; shareTenantContact: boolean; alreadyAgreed: boolean }) {
  return call<unknown>(token, "POST", `/requests/${requestId}/job`, input);
}

export function changeInstructions(token: string, requestId: number, instructions: string, shareTenantContact: boolean) {
  return call<unknown>(token, "PUT", `/requests/${requestId}/job/instructions`, { Instructions: instructions || null, ShareTenantContact: shareTenantContact });
}

export function takeBackJob(token: string, requestId: number, reason: string) {
  return call<unknown>(token, "POST", `/requests/${requestId}/job/take-back`, { Reason: reason || null });
}

// An update the landlord enters for a contractor who is not in the app.
export function enterJobUpdate(token: string, requestId: number, update: JobUpdateInput) {
  return call<unknown>(token, "POST", `/requests/${requestId}/job/updates`, update);
}

// Sends the open job's link again (a new link; the old one stops working), or cancels it.
export function setJobLink(token: string, requestId: number, send: boolean) {
  return call<unknown>(token, send ? "POST" : "DELETE", `/requests/${requestId}/job/link`);
}

// --- Quotes ---

export function requestQuotes(token: string, requestId: number, contractorIds: number[], note: string) {
  return call<unknown>(token, "POST", `/requests/${requestId}/quotes`, { ContractorIds: contractorIds, Note: note || null });
}

export function cancelQuote(token: string, requestId: number, quoteId: number) {
  return call<unknown>(token, "POST", `/requests/${requestId}/quotes/${quoteId}/cancel`);
}

// Enters a quote for a contractor who is not in the app (from a phone call or an emailed PDF). Can be entered again to revise it.
export function submitQuote(token: string, requestId: number, quoteId: number, input: { amountCents: number; taxMode: string; note: string | null; validUntil: string | null }) {
  return call<unknown>(token, "POST", `/requests/${requestId}/quotes/${quoteId}/submit`, input);
}

export function declineQuote(token: string, requestId: number, quoteId: number, reason: string) {
  return call<unknown>(token, "POST", `/requests/${requestId}/quotes/${quoteId}/decline`, { Reason: reason || null });
}

// Accepts a sent quote with the amount and tax choice the landlord saw (409 "changed" if the contractor revised it meanwhile).
export function acceptQuote(
  token: string,
  requestId: number,
  quoteId: number,
  input: { amountCents: number; taxMode: string; instructions: string | null; shareTenantContact: boolean },
) {
  return call<unknown>(token, "POST", `/requests/${requestId}/quotes/${quoteId}/accept`, input);
}

export function setQuoteLink(token: string, requestId: number, quoteId: number, send: boolean) {
  return call<unknown>(token, send ? "POST" : "DELETE", `/requests/${requestId}/quotes/${quoteId}/link`);
}
