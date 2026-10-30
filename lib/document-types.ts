// Types for lease documents and signing (the backend's /api/v1/documents and /tenancies/{id}/documents routes).
// Words come as enum names such as "AwaitingTenants" or "Online"; lib/document-format.ts turns them into plain text.

export interface DocumentSigner {
  id: number;
  role: "Landlord" | "Tenant";
  displayName: string;
  // Only the landlord gets emails.
  email: string | null;
  status: "Pending" | "Signed" | "Declined";
  method: "Paper" | "Online" | null;
  signedAt: string | null;
  signedVersion: number | null;
  declineNote: string | null;
  typedName: string | null;
  drawnSignature: boolean;
}

// A tenant's (or the landlord's) uploaded scan of the signed paper copy.
export interface DocumentCopy {
  id: number;
  versionNumber: number;
  uploadedByName: string;
  uploadedAt: string;
  fileName: string;
  pageCount: number;
  status: string;
  rejectReason: string | null;
  tenantConfirmedAt: string | null;
  coversSigners: string[];
}

export interface DocumentEvent {
  id: number;
  type: string;
  actorName: string | null;
  at: string;
  detail: string | null;
}

export interface OnlineSigningAvailability {
  available: boolean;
  reason: string | null;
  message: string | null;
}

export interface LeaseDocument {
  id: number;
  publicCode: string;
  title: string;
  kind: string;
  status: "Draft" | "AwaitingLandlord" | "AwaitingTenants" | "Completed" | "Declined" | "Withdrawn" | "Expired";
  tenancyId: number | null;
  currentVersion: number;
  fileName: string;
  pageCount: number;
  createdAt: string;
  sentAt: string | null;
  completedAt: string | null;
  copySentAt: string | null;
  expiresAt: string | null;
  expiredAt: string | null;
  withdrawnAt: string | null;
  isPastDeadline: boolean;
  yourRole: string;
  yourStatus: string | null;
  signers: DocumentSigner[];
  copies: DocumentCopy[];
  // Null for tenants: only the landlord sees the event trail.
  events: DocumentEvent[] | null;
  printCopyReady: boolean;
  termsSnapshot: string | null;
  province: string | null;
  onlineSigning: OnlineSigningAvailability;
  finalCopyReady: boolean;
}

export interface DocumentListItem {
  id: number;
  publicCode: string;
  title: string;
  status: LeaseDocument["status"];
  tenancyId: number | null;
  currentVersion: number;
  createdAt: string;
  sentAt: string | null;
  expiresAt: string | null;
  signedCount: number;
  signerCount: number;
  yourStatus: string | null;
}

// The checklist for signing online: what the signed-in person has done and what is still needed.
export interface SigningStatus {
  myTurn: boolean;
  available: boolean;
  reason: string | null;
  message: string | null;
  version: number;
  pageCount: number;
  pagesViewed: number;
  allPagesViewed: boolean;
  pagesRequired: boolean;
  consentVersion: string;
  consentText: string;
  nameComplete: boolean;
  emailMasked: string;
  codeVerified: boolean;
  signBy: string | null;
}

export interface DocumentDownload {
  // "lease", "print_copy", "signed_copy" and similar; the backend decides the kinds.
  kind: string;
  fileName: string;
  url: string;
  copyId: number | null;
}

export interface UploadTarget {
  blobPath: string;
  uploadUrl: string;
  expiresAt: string;
}

// A drawn signature: strokes of points on a canvas of the given size.
export interface SignatureDrawing {
  width: number;
  height: number;
  strokes: { x: number; y: number }[][];
}

export interface SignOnlineInput {
  version: number;
  consentVersion: string;
  givenNames: string;
  surname: string;
  signature: SignatureDrawing | null;
}
