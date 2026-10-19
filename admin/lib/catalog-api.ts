// Calls for the plan catalog: the features and limits that plans are built from.
import { getJson } from "@/lib/api-client";
import { send } from "@/lib/staff-api";
import type { Catalog } from "@/lib/types";

const CATALOG = "/api/v1/admin/catalog";

export function getCatalog(token: string) {
  return getJson<Catalog>(CATALOG, token);
}

// Adds a feature. The key (like "reports.export") can't be changed afterwards.
export function createFeature(token: string, input: { key: string; displayName: string; description: string }) {
  return send<{ id: number }>("POST", `${CATALOG}/features`, token, {
    Key: input.key,
    DisplayName: input.displayName,
    Description: input.description,
  });
}

// Changes a feature's display name and description (never its key).
export function updateFeature(token: string, featureId: number, input: { displayName: string; description: string }) {
  return send<null>("PUT", `${CATALOG}/features/${featureId}`, token, {
    DisplayName: input.displayName,
    Description: input.description,
  });
}

// Renames a limit. Limits themselves are defined in the backend code and can't be added here.
export function updateLimitType(token: string, limitTypeId: number, displayName: string) {
  return send<null>("PUT", `${CATALOG}/limits/${limitTypeId}`, token, { DisplayName: displayName });
}
