// Backend calls for the landlord's maintenance screens. Used only on the server (pages and server actions).
import type {
  LandlordListFilters,
  LandlordPage,
  LandlordRequestDetail,
  LandlordSummary,
  MaintenanceSettings,
  UploadTarget,
  Visibility,
} from "@/lib/landlord-maintenance-types";
import { maintenanceCall, orNull } from "@/lib/maintenance-call";

const BASE = "/api/v1/maintenance";

// The landlord calls all start with the same path.
const call = <T>(token: string, method: string, path: string, body?: unknown) => maintenanceCall<T>(token, method, `${BASE}${path}`, body);

// The numbers for the tiles and chips, for all properties or one.
export function getSummary(token: string, propertyId?: string) {
  const query = propertyId ? `?propertyId=${encodeURIComponent(propertyId)}` : "";
  return call<LandlordSummary>(token, "GET", `/summary${query}`);
}

// One page of requests. Only the filters that were chosen are sent.
export function listRequests(token: string, filters: LandlordListFilters) {
  const query = new URLSearchParams({ pageSize: "20" });
  for (const [key, value] of Object.entries(filters)) if (value) query.set(key, value);
  return call<LandlordPage>(token, "GET", `/requests?${query}`);
}

// The request page. Opening an open request for the first time marks it Seen and tells the tenants.
export function getRequest(token: string, id: number): Promise<LandlordRequestDetail | null> {
  return orNull(call<LandlordRequestDetail>(token, "GET", `/requests/${id}`));
}

export function setUrgency(token: string, id: number, urgency: string) {
  return call<null>(token, "PUT", `/requests/${id}/urgency`, { Urgency: urgency });
}

export function addComment(token: string, id: number, body: string, visibility: Visibility) {
  return call<{ id: number }>(token, "POST", `/requests/${id}/comments`, { Body: body, Visibility: visibility.toLowerCase() });
}

export function completeRequest(token: string, id: number, note: string) {
  return call<null>(token, "POST", `/requests/${id}/complete`, { Note: note });
}

export function cancelRequest(token: string, id: number, reason: string) {
  return call<null>(token, "POST", `/requests/${id}/cancel`, { Reason: reason });
}

export function reopenRequest(token: string, id: number, reason: string) {
  return call<null>(token, "POST", `/requests/${id}/reopen`, { Reason: reason });
}

export function getSettings(token: string) {
  return call<MaintenanceSettings>(token, "GET", "/settings");
}

export function saveSettings(token: string, emergencyPhone: string, contractorName: string, contractorPhone: string) {
  return call<MaintenanceSettings>(token, "PUT", "/settings", {
    EmergencyPhone: emergencyPhone || null,
    ContractorContactName: contractorName || null,
    ContractorContactPhone: contractorPhone || null,
  });
}

// Photo and video upload is three steps: get an address, PUT the file there from the browser, then register it.
export function mediaUploadUrl(token: string, id: number, extension: string): Promise<UploadTarget> {
  return call(token, "POST", `/requests/${id}/media/upload-url`, { Extension: extension });
}

export function registerMedia(token: string, id: number, blobPath: string, fileName: string) {
  return call<{ id: number; kind: string }>(token, "POST", `/requests/${id}/media`, { BlobPath: blobPath, FileName: fileName });
}
