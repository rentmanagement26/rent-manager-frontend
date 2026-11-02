// Calls for changing plans (packages): create one, publish a new version of its price/limits/features, edit its details.
import { send } from "@/lib/staff-api";
import type { PublishPreview, TermsEndResult } from "@/lib/types";

const PACKAGES = "/api/v1/admin/packages";

// The price, limits and features that make up one version of a plan.
export interface PlanContentInput {
  monthlyPrice: number;
  limits: { limitKey: string; value: number }[];
  featureKeys: string[];
}

function toBody(content: PlanContentInput) {
  return {
    MonthlyPrice: content.monthlyPrice,
    Limits: content.limits.map((l) => ({ LimitKey: l.limitKey, Value: l.value })),
    Features: content.featureKeys,
  };
}

// A new plan with its first version.
export function createPackage(token: string, input: PlanContentInput & { name: string; sortOrder: number }) {
  return send<{ id: number }>("POST", PACKAGES, token, { ...toBody(input), Name: input.name, SortOrder: input.sortOrder });
}

// A new version of an existing plan. The old version stays in the history; the note is required.
export function publishPackageVersion(token: string, packageId: number, input: PlanContentInput & { note: string }) {
  return send<{ id: number }>("POST", `${PACKAGES}/${packageId}/versions`, token, { ...toBody(input), Note: input.note });
}

// Name, order, on/off and default. Only the fields given are changed.
export function updatePackage(
  token: string,
  packageId: number,
  input: { name?: string; sortOrder?: number; isActive?: boolean; isDefault?: boolean },
) {
  return send<null>("PUT", `${PACKAGES}/${packageId}`, token, {
    Name: input.name,
    SortOrder: input.sortOrder,
    IsActive: input.isActive,
    IsDefault: input.isDefault,
  });
}

// A dry run of publishing: who would be told what, and when. Nothing is saved or sent.
export function previewPublish(token: string, packageId: number, content: PlanContentInput) {
  return send<PublishPreview>("POST", `${PACKAGES}/${packageId}/versions/preview`, token, toBody(content));
}

// Sets or changes the end date of older terms (a yyyy-mm-dd date at least the price-rise notice, 60 days, away).
export function setTermsEndDate(token: string, packageId: number, versionId: number, endsAt: string, note: string) {
  return send<TermsEndResult>("PUT", `${PACKAGES}/${packageId}/versions/${versionId}/end-date`, token, { EndsAt: endsAt, Note: note });
}

// Takes the end date off older terms. The landlords on them go back to the usual rules and are told.
export function clearTermsEndDate(token: string, packageId: number, versionId: number, note: string) {
  return send<TermsEndResult>("POST", `${PACKAGES}/${packageId}/versions/${versionId}/end-date/cancel`, token, { Note: note });
}
