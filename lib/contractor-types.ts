// Types for the landlord's contractors, jobs and quotes, as the backend answers them (camelCase JSON, words from fixed lists as names).

// How a contractor gets work. InTheApp only happens when they accept the landlord's invitation: it is never a choice in a form.
export type HowTheyWork = "InTheApp" | "EmailLink" | "PhoneOnly";

export interface ContractorTrade {
  category: string;
  isPreferred: boolean;
}

// One row of the landlord's contractor list.
export interface ContractorListItem {
  id: number;
  // The company name, or the person's name when there is none: use it in lists and dialogs.
  displayName: string;
  name: string;
  companyName: string | null;
  trades: ContractorTrade[];
  howTheyWork: HowTheyWork;
  invitation: "Sent" | "Expired" | null;
  invitedAt: string | null;
  phone: string;
  email: string | null;
  isActive: boolean;
  canInvite: boolean;
  jobCount: number;
  openJobCount: number;
}

export interface ContractorList {
  items: ContractorListItem[];
  activeCount: number;
  inactiveCount: number;
}

// One contractor in full.
export interface ContractorDetail extends ContractorListItem {
  inviteExpiresAt: string | null;
  notes: string | null;
  canDelete: boolean;
  linkedAt: string | null;
  linkedAccountName: string | null;
}

// What the add and edit form sends. preferredTrades must be among trades.
export interface ContractorInput {
  name: string;
  companyName: string | null;
  trades: string[];
  preferredTrades: string[];
  phone: string;
  email: string | null;
  // "InTheApp" is only sent back for a contractor who already is: the backend ignores it.
  howTheyWork: HowTheyWork;
  notes: string | null;
}

export type JobStatus = "Offered" | "Accepted" | "Declined" | "Done" | "Cancelled";

// Which "enter their answer" buttons the landlord may use for a contractor who is not in the app. All false for one in the app.
export interface JobOnBehalf {
  canAccept: boolean;
  canDecline: boolean;
  canSetVisit: boolean;
  canWaitForParts: boolean;
  canPartsArrived: boolean;
  canAddNote: boolean;
  canMarkDone: boolean;
  canAddFiles: boolean;
}

export type TaxMode = "Included" | "Extra";

// A contractor job on the request page. Files are typed with the work-files screens.
export interface ContractorJob {
  id: number;
  status: JobStatus;
  contractor: { id: number; displayName: string; howTheyWork: HowTheyWork };
  instructions: string | null;
  shareTenantContact: boolean;
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
  isOpen: boolean;
  canTakeBack: boolean;
  canChangeInstructions: boolean;
  onBehalf: JobOnBehalf;
  // Set when the job came from an accepted quote.
  quoteId: number | null;
  agreedAmountCents: number | null;
  agreedTaxMode: TaxMode | null;
  linkState: "Sent" | "Expired" | null;
  linkSentAt: string | null;
  linkExpiresAt: string | null;
  canSendLink: boolean;
}

export type QuoteStatus = "Requested" | "Submitted" | "Declined" | "Accepted" | "NotSelected" | "Cancelled";

export interface QuoteFile {
  id: number;
  kind: "Photo" | "Video" | "Document";
  fileName: string;
  contentType: string;
  sizeBytes: number;
  url: string;
  addedAt: string;
  addedBy: string;
  viaLink: boolean;
  canRemove: boolean;
}

// A quote. Amounts are private to the landlord and the contractor: a tenant never sees one.
export interface Quote {
  id: number;
  status: QuoteStatus;
  contractor: { id: number; displayName: string; howTheyWork: HowTheyWork };
  requestedAt: string;
  requestNote: string | null;
  // Whole cents, Canadian dollars.
  amountCents: number | null;
  taxMode: TaxMode | null;
  quoteNote: string | null;
  // A calendar day such as "2026-11-20".
  validUntil: string | null;
  isExpired: boolean;
  submittedAt: string | null;
  decidedAt: string | null;
  declineReason: string | null;
  enteredByLandlord: boolean;
  isOpen: boolean;
  actions: { canAccept: boolean; canCancel: boolean; canEnterQuote: boolean; canEnterDecline: boolean; canAddFiles: boolean };
  linkState: "Sent" | "Expired" | null;
  linkExpiresAt: string | null;
  canSendLink: boolean;
  files: QuoteFile[] | null;
}

// The update a landlord enters for a contractor who is not in the app. `type` is one of the words the backend lists.
export interface JobUpdateInput {
  type: "accepted" | "declined" | "visit" | "waiting_for_parts" | "parts_arrived" | "note" | "done";
  note?: string | null;
  reason?: string | null;
  visitDate?: string | null;
  visitWindow?: string | null;
  expectedBy?: string | null;
  visibleToTenant?: boolean;
}
