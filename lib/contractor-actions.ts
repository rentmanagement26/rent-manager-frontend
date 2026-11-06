"use server";

// Server actions for the landlord's contractors, jobs and quotes. Client components call these; each answers { ok, data } or
// { error, expired } so a screen can show the backend's message instead of crashing. The backend checks every call as well.
import * as api from "@/lib/contractor-api";
import type { ContractorDetail, ContractorInput, ContractorList, JobUpdateInput } from "@/lib/contractor-types";
import { runMaintenance } from "@/lib/maintenance-call";

// The landlord's calls: signed in as a landlord, every outcome turned into an ActionResult.
const run = <T>(work: (token: string) => Promise<T>) => runMaintenance(["Admin", "Landlord"], work);

const id = (value: number) => Number(value);

// --- Contractors ---

// The contractors for the assign and quote dialogs: active ones, those of the request's trade first.
export async function suggestContractorsAction(category: string) {
  return run<ContractorList>((token) => api.listContractors(token, { status: "active", category: String(category) }));
}

export async function createContractorAction(input: ContractorInput) {
  return run<ContractorDetail>((token) => api.createContractor(token, input));
}

export async function updateContractorAction(contractorId: number, input: ContractorInput) {
  return run<ContractorDetail>((token) => api.updateContractor(token, id(contractorId), input));
}

export async function setContractorActiveAction(contractorId: number, active: boolean) {
  return run((token) => api.setContractorActive(token, id(contractorId), !!active));
}

export async function inviteContractorAction(contractorId: number) {
  return run((token) => api.inviteContractor(token, id(contractorId)));
}

export async function deleteContractorAction(contractorId: number) {
  return run((token) => api.deleteContractor(token, id(contractorId)));
}

// --- Jobs ---

export async function assignJobAction(requestId: number, contractorId: number, instructions: string, shareTenantContact: boolean, alreadyAgreed: boolean) {
  return run((token) =>
    api.assignJob(token, id(requestId), {
      contractorId: id(contractorId),
      instructions: String(instructions).trim() || null,
      shareTenantContact: !!shareTenantContact,
      alreadyAgreed: !!alreadyAgreed,
    }),
  );
}

export async function changeInstructionsAction(requestId: number, instructions: string, shareTenantContact: boolean) {
  return run((token) => api.changeInstructions(token, id(requestId), String(instructions).trim(), !!shareTenantContact));
}

export async function takeBackJobAction(requestId: number, reason: string) {
  return run((token) => api.takeBackJob(token, id(requestId), String(reason).trim()));
}

export async function enterJobUpdateAction(requestId: number, update: JobUpdateInput) {
  return run((token) => api.enterJobUpdate(token, id(requestId), update));
}

export async function setJobLinkAction(requestId: number, send: boolean) {
  return run((token) => api.setJobLink(token, id(requestId), !!send));
}

// --- Quotes ---

export async function requestQuotesAction(requestId: number, contractorIds: number[], note: string) {
  return run((token) => api.requestQuotes(token, id(requestId), contractorIds.map(Number), String(note).trim()));
}

export async function cancelQuoteAction(requestId: number, quoteId: number) {
  return run((token) => api.cancelQuote(token, id(requestId), id(quoteId)));
}

export async function submitQuoteAction(requestId: number, quoteId: number, amountCents: number, taxMode: string, note: string, validUntil: string) {
  return run((token) =>
    api.submitQuote(token, id(requestId), id(quoteId), {
      amountCents: Math.round(Number(amountCents)),
      taxMode: String(taxMode),
      note: String(note).trim() || null,
      validUntil: validUntil || null,
    }),
  );
}

export async function declineQuoteAction(requestId: number, quoteId: number, reason: string) {
  return run((token) => api.declineQuote(token, id(requestId), id(quoteId), String(reason).trim()));
}

export async function acceptQuoteAction(requestId: number, quoteId: number, amountCents: number, taxMode: string, instructions: string, shareTenantContact: boolean) {
  return run((token) =>
    api.acceptQuote(token, id(requestId), id(quoteId), {
      amountCents: Math.round(Number(amountCents)),
      taxMode: String(taxMode),
      instructions: String(instructions).trim() || null,
      shareTenantContact: !!shareTenantContact,
    }),
  );
}

export async function setQuoteLinkAction(requestId: number, quoteId: number, send: boolean) {
  return run((token) => api.setQuoteLink(token, id(requestId), id(quoteId), !!send));
}
