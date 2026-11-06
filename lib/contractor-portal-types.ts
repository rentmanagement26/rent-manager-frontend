// Types for the contractor's own screens (a contractor with an account, and the no-account email link), as the backend answers them
// (camelCase JSON, words from fixed lists as names). A contractor never sees a tenant's phone, another contractor's quote or who else was asked.
import type { TaxMode } from "@/lib/contractor-types";
import type { AccessDetails, TimelineEntry } from "@/lib/maintenance-types";

// A photo, video or PDF of the work or of a written quote. `url` stops working after about 10 minutes.
export interface WorkFile {
  id: number;
  kind: "Photo" | "Video" | "Document";
  fileName: string;
  contentType: string;
  sizeBytes: number;
  url: string;
  addedAt: string;
  addedBy: string;
  addedByRole: string;
  viaLink: boolean;
  canRemove: boolean;
}

// A photo or video of the problem, shown to the contractor while the job or quote is open.
export interface ProblemMedia {
  id: number;
  kind: "Photo" | "Video";
  fileName: string;
  contentType: string;
  sizeBytes: number;
  url: string;
}

// One row of "My jobs".
export interface MyJobItem {
  id: number;
  number: string;
  title: string;
  category: string;
  urgency: string;
  status: "Offered" | "Accepted" | "Declined" | "Done" | "Cancelled";
  landlordName: string;
  entryName: string;
  placeLabel: string;
  visitDate: string | null;
  visitWindow: string | null;
  waitingForParts: boolean;
  partsExpectedBy: string | null;
  offeredAt: string;
  updatedAt: string;
  isOpen: boolean;
  needsAnswer: boolean;
}

export interface MyJobList {
  items: MyJobItem[];
  openCount: number;
  needsAnswerCount: number;
  finishedCount: number;
}

// Who the contractor may ask questions: the landlord's chosen contact (or their own name and phone).
export interface LandlordContact {
  name: string;
  phone: string | null;
  isFallback: boolean;
}

// What the contractor may do with the job right now. Show a button only when its flag is true.
export interface MyJobActions {
  canAccept: boolean;
  canDecline: boolean;
  canSetVisit: boolean;
  canWaitForParts: boolean;
  canPartsArrived: boolean;
  canAddNote: boolean;
  canMarkDone: boolean;
  canAddFiles: boolean;
}

// One job. While open it has the address, the problem, access details and instructions; once finished only a summary stays (those are null).
export interface MyJob {
  id: number;
  number: string;
  title: string;
  category: string;
  location: string;
  commonAreaLocation: string | null;
  urgency: string;
  status: MyJobItem["status"];
  isOpen: boolean;
  landlordName: string;
  entryName: string;
  placeLabel: string;
  unitLabel: string | null;
  propertyName: string;
  description: string | null;
  address: string | null;
  // "Tenant of Unit 204": the tenant's name only when the landlord chose to share it.
  tenantLabel: string | null;
  tenantContact: { name: string; phone: string | null } | null;
  instructions: string | null;
  landlordContact: LandlordContact | null;
  access: AccessDetails | null;
  media: ProblemMedia[];
  offeredAt: string;
  acceptedAt: string | null;
  respondedAt: string | null;
  declineReason: string | null;
  visitDate: string | null;
  visitWindow: string | null;
  waitingForParts: boolean;
  waitingForPartsSince: string | null;
  partsNote: string | null;
  partsExpectedBy: string | null;
  doneAt: string | null;
  doneNote: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  timeline: TimelineEntry[];
  actions: MyJobActions;
  agreedAmountCents: number | null;
  agreedTaxMode: TaxMode | null;
  files: WorkFile[];
}

export type MyQuoteStatus = "Requested" | "Submitted" | "Declined" | "Accepted" | "NotSelected" | "Cancelled";

// One row of "Quote requests".
export interface MyQuoteItem {
  id: number;
  number: string;
  title: string;
  category: string;
  urgency: string;
  status: MyQuoteStatus;
  landlordName: string;
  entryName: string;
  placeLabel: string;
  requestedAt: string;
  updatedAt: string;
  amountCents: number | null;
  currency: string;
  taxMode: TaxMode | null;
  validUntil: string | null;
  isExpired: boolean;
  isOpen: boolean;
  needsQuote: boolean;
}

export interface MyQuoteList {
  items: MyQuoteItem[];
  needsQuoteCount: number;
  sentCount: number;
  closedCount: number;
}

// One quote request. A closed quote is a summary: the contractor's own amount, tax choice, note, valid-until day and decline reason.
export interface MyQuote {
  id: number;
  number: string;
  title: string;
  category: string;
  location: string;
  commonAreaLocation: string | null;
  urgency: string;
  status: MyQuoteStatus;
  isOpen: boolean;
  landlordName: string;
  entryName: string;
  placeLabel: string;
  unitLabel: string | null;
  propertyName: string;
  description: string | null;
  address: string | null;
  tenantLabel: string | null;
  requestNote: string | null;
  landlordContact: LandlordContact | null;
  access: AccessDetails | null;
  media: ProblemMedia[];
  amountCents: number | null;
  currency: string;
  taxMode: TaxMode | null;
  quoteNote: string | null;
  validUntil: string | null;
  isExpired: boolean;
  requestedAt: string;
  submittedAt: string | null;
  decidedAt: string | null;
  declineReason: string | null;
  // Set on an accepted quote: open that job.
  jobId: number | null;
  actions: { canSubmit: boolean; canDecline: boolean; canAddFiles: boolean };
  files: WorkFile[];
}

// What the invitation page shows before the contractor signs in or registers.
export interface Invitation {
  landlordName: string;
  contractorName: string;
  email: string | null;
  state: "Valid" | "Expired";
  expiresAt: string;
}

// The no-account link page: one job or one quote (the other is null).
export interface LinkPage {
  kind: "job" | "quote";
  expiresAt: string;
  job: MyJob | null;
  quote: MyQuote | null;
}

// What the quote form sends: whole cents, Canadian dollars.
export interface QuoteInput {
  amountCents: number;
  taxMode: string;
  note: string | null;
  validUntil: string | null;
}
