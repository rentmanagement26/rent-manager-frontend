// Types for the landlord's maintenance screens, as the backend answers them (camelCase JSON, words from fixed lists as names).
import type { ContractorJob, Quote } from "@/lib/contractor-types";
import type { AccessDetails, RequestStatus, UploadTarget } from "@/lib/maintenance-types";

export type { UploadTarget };

export type Urgency = "Low" | "Normal" | "High" | "Emergency";

// One row of the landlord's list.
export interface LandlordListItem {
  id: number;
  number: string;
  title: string;
  category: string;
  location: string;
  commonAreaLocation: string | null;
  urgency: Urgency;
  status: RequestStatus;
  progress: string | null;
  progressDate: string | null;
  propertyId: number;
  propertyName: string;
  unitId: number | null;
  placeLabel: string;
  reportedByName: string;
  reportedByRole: "Tenant" | "Landlord";
  source: "TenantApp" | "LandlordApp";
  createdAt: string;
  updatedAt: string;
  // True for an open request the landlord has not opened yet: shown as a dot.
  unseen: boolean;
  photoCount: number;
  hasVideo: boolean;
}

export interface LandlordPage {
  items: LandlordListItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

// The numbers for the tiles and the status chips.
export interface LandlordSummary {
  total: number;
  open: number;
  new: number;
  inProgress: number;
  done: number;
  cancelled: number;
  openEmergencies: number;
  doneLast30Days: number;
  unseen: number;
}

// A photo or video on the request. `url` stops working after about 10 minutes.
export interface LandlordMedia {
  id: number;
  kind: "Photo" | "Video";
  fileName: string;
  contentType: string;
  sizeBytes: number;
  url: string;
  uploadedAt: string;
  uploadedByName: string;
  uploadedByRole: "Tenant" | "Landlord";
  uploadedByMe: boolean;
  canRemove: boolean;
}

// Who may read a timeline entry: everyone (tenants too), the work (landlord and contractor), or only the landlord.
export type Visibility = "Everyone" | "Work" | "Private";

export interface LandlordTimelineEntry {
  kind: "event" | "comment";
  id: number;
  at: string;
  type: string | null;
  actorRole: string;
  actorName: string;
  isMe: boolean;
  text: string;
  body: string | null;
  visibility: Visibility;
}

// A tenant on the request's tenancy. `phone` is only ever the reporter's number for this request.
export interface RequestPerson {
  name: string;
  isReporter: boolean;
  isCurrent: boolean;
  phone: string | null;
}

// What the landlord may do with the request right now. Show a button only when its flag is true.
export interface LandlordPermissions {
  canComment: boolean;
  canAddMedia: boolean;
  canEditDetails: boolean;
  canEditAccess: boolean;
  canSetUrgency: boolean;
  canEditTitle: boolean;
  canComplete: boolean;
  canCancel: boolean;
  canReopen: boolean;
  canAssignJob: boolean;
  canRequestQuotes: boolean;
  reopenUntil: string | null;
}

// The landlord's page for one request.
export interface LandlordRequestDetail {
  id: number;
  number: string;
  title: string;
  description: string;
  category: string;
  location: string;
  commonAreaLocation: string | null;
  urgency: Urgency;
  status: RequestStatus;
  progress: string | null;
  progressDate: string | null;
  propertyId: number;
  propertyName: string;
  unitId: number | null;
  placeLabel: string;
  tenancyId: number | null;
  reportedByName: string;
  reportedByRole: "Tenant" | "Landlord";
  source: "TenantApp" | "LandlordApp";
  createdAt: string;
  updatedAt: string;
  seenByLandlordAt: string | null;
  doneAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  reopenCount: number;
  access: AccessDetails | null;
  accessUpdatedByName: string | null;
  media: LandlordMedia[];
  tenants: RequestPerson[];
  timeline: LandlordTimelineEntry[];
  permissions: LandlordPermissions;
  // The open contractor job, or the last one when it explains the request (declined, taken back, or the one that finished it).
  job: ContractorJob | null;
  earlierJobs: ContractorJob[];
  quotes: Quote[];
  quotesOpen: number;
  quotesReceived: number;
}

// The filters of the list, as they appear in the page address.
export interface LandlordListFilters {
  status?: string;
  propertyId?: string;
  urgency?: string;
  category?: string;
  q?: string;
  sort?: string;
  page?: string;
}

// The landlord's maintenance settings. `contractorSees` is what a contractor will see on a job.
export interface MaintenanceSettings {
  emergencyPhone: string | null;
  contractorContactName: string | null;
  contractorContactPhone: string | null;
  contractorSees: { name: string; phone: string; isFallback: boolean };
  updatedAt: string | null;
}

// What the "new request" form needs for one unit: its label, and the names of the people who rent it now (empty when nobody does).
export interface LandlordRequestForm {
  unitId: number;
  placeLabel: string;
  propertyId: number;
  propertyName: string;
  hasActiveTenancy: boolean;
  tenants: string[];
}

// What the landlord sends to create a request. A unit request has unitId; a common-area request has propertyId and location "CommonArea".
export interface CreateRequestInput {
  unitId: number | null;
  propertyId: number | null;
  category: string;
  location: string;
  commonAreaLocation: string | null;
  description: string;
  urgency: string;
  title: string | null;
  shareWithTenants: boolean;
}
