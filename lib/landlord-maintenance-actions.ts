"use server";

// Server actions for the landlord's maintenance screens. Client components call these; each answers { ok, data } or { error, expired } so a
// screen can show the backend's message instead of crashing. The backend checks every call as well.
import * as api from "@/lib/landlord-maintenance-api";
import type { CreateRequestInput, LandlordRequestForm, MaintenanceSettings, UploadTarget, Visibility } from "@/lib/landlord-maintenance-types";
import { runMaintenance } from "@/lib/maintenance-call";
import type { ActionResult } from "@/lib/document-actions";

// The landlord's calls: signed in as a landlord, every outcome turned into an ActionResult.
const run = <T>(work: (token: string) => Promise<T>) => runMaintenance(["Admin", "Landlord"], work);

export async function setUrgencyAction(id: number, urgency: string) {
  return run((token) => api.setUrgency(token, Number(id), String(urgency)));
}

export async function addLandlordCommentAction(id: number, body: string, visibility: Visibility) {
  return run((token) => api.addComment(token, Number(id), String(body).trim(), visibility));
}

export async function completeRequestAction(id: number, note: string) {
  return run((token) => api.completeRequest(token, Number(id), String(note).trim()));
}

export async function cancelLandlordRequestAction(id: number, reason: string) {
  return run((token) => api.cancelRequest(token, Number(id), String(reason).trim()));
}

export async function reopenLandlordRequestAction(id: number, reason: string) {
  return run((token) => api.reopenRequest(token, Number(id), String(reason).trim()));
}

export async function saveSettingsAction(emergencyPhone: string, contractorName: string, contractorPhone: string): Promise<ActionResult<MaintenanceSettings>> {
  return run((token) => api.saveSettings(token, String(emergencyPhone).trim(), String(contractorName).trim(), String(contractorPhone).trim()));
}

export async function requestFormAction(unitId: number): Promise<ActionResult<LandlordRequestForm | null>> {
  return run((token) => api.getRequestForm(token, Number(unitId)));
}

export async function createRequestAction(input: CreateRequestInput) {
  return run((token) => api.createRequest(token, input));
}

export async function landlordMediaUploadUrlAction(id: number, extension: string): Promise<ActionResult<UploadTarget>> {
  return run((token) => api.mediaUploadUrl(token, Number(id), String(extension)));
}

export async function landlordRegisterMediaAction(id: number, blobPath: string, fileName: string) {
  return run((token) => api.registerMedia(token, Number(id), String(blobPath), String(fileName)));
}
