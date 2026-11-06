// Types for the tenant's maintenance requests, as the backend answers them (camelCase JSON). Words from fixed lists arrive as names,
// for example "InProgress" or "LivingRoom".

export type RequestStatus = "New" | "InProgress" | "Done" | "Cancelled";

// How to get into the unit. bestTimes holds names such as "WeekdayAfternoons" and "Evenings".
export interface AccessDetails {
  permissionToEnter: "AnyTime" | "OnlyWhenHome" | "CallFirst";
  accessNotes: string | null;
  bestTimes: string[];
  contactMethod: "Phone" | "Text" | "Email" | null;
  contactPhone: string | null;
  hasPets: boolean | null;
  updatedAt: string | null;
}

// What the report form needs for one home. accessSource says where the pre-filled access details came from.
export interface ReportForm {
  tenancyId: number;
  unitLabel: string;
  emergencyPhone: string | null;
  access: AccessDetails;
  accessSource: "YourLastRequest" | "HouseholdRequest" | "None";
  accessFromNumber: string | null;
}

// An open request for the same place and category (the form offers to add a comment to it instead).
export interface SimilarRequest {
  id: number;
  number: string;
  title: string;
  status: RequestStatus;
  reportedByName: string;
  reportedByMe: boolean;
  createdAt: string;
}

// One row of "My requests".
export interface RequestListItem {
  id: number;
  number: string;
  title: string;
  category: string;
  location: string;
  commonAreaLocation: string | null;
  urgency: string;
  status: RequestStatus;
  progress: string | null;
  // A calendar day such as "2026-11-08" (the visit day, or the day parts are expected).
  progressDate: string | null;
  placeLabel: string;
  reportedByName: string;
  reportedByMe: boolean;
  createdAt: string;
  updatedAt: string;
  canReopen: boolean;
  reopenUntil: string | null;
}

// A photo or video on a request. `url` stops working after about 10 minutes, so it is never stored.
export interface MediaItem {
  id: number;
  kind: "Photo" | "Video";
  fileName: string;
  contentType: string;
  sizeBytes: number;
  url: string;
  uploadedAt: string;
  uploadedByMe: boolean;
  canRemove: boolean;
}

// One line of the timeline: an event or a comment. The server writes `text`; show it as it is.
export interface TimelineEntry {
  kind: "event" | "comment";
  id: number;
  at: string;
  type: string | null;
  actorRole: string;
  actorName: string;
  isMe: boolean;
  text: string;
  body: string | null;
}

// What the tenant may do with this request right now. Show a button only when its flag is true.
export interface RequestPermissions {
  canEdit: boolean;
  canEditAccess: boolean;
  canComment: boolean;
  canAddMedia: boolean;
  canCancel: boolean;
  canReopen: boolean;
  reopenUntil: string | null;
}

// The visit a contractor planned. Appears only while a contractor has accepted the job.
export interface TenantVisit {
  contractorName: string;
  visitDate: string | null;
  visitWindow: string | null;
  waitingForParts: boolean;
  partsExpectedBy: string | null;
}

// The whole request page.
export interface RequestDetail extends RequestListItem {
  description: string;
  seenByLandlordAt: string | null;
  doneAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  reopenCount: number;
  access: AccessDetails | null;
  media: MediaItem[];
  timeline: TimelineEntry[];
  permissions: RequestPermissions;
  visit: TenantVisit | null;
}

// What the person types for "Getting into your unit".
export interface AccessInput {
  permissionToEnter: string;
  accessNotes: string;
  bestTimes: string[];
  contactMethod: string | null;
  contactPhone: string;
  hasPets: boolean | null;
}

// The same details as sent to the backend: empty text becomes null.
export interface AccessPayload {
  permissionToEnter: string;
  accessNotes: string | null;
  bestTimes: string[];
  contactMethod: string | null;
  contactPhone: string | null;
  hasPets: boolean | null;
}

// What the report form sends.
export interface ReportInput {
  tenancyId: number;
  category: string;
  location: string;
  commonAreaLocation: string | null;
  description: string;
  isEmergency: boolean;
  access: AccessPayload | null;
}

// The temporary address a photo or video is uploaded to (valid for 15 minutes).
export interface UploadTarget {
  blobPath: string;
  uploadUrl: string;
  expiresAt: string;
}
