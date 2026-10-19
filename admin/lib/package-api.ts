// Calls for changing plans (packages): create one, publish a new version of its price/limits/features, edit its details.
import { send } from "@/lib/staff-api";

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
