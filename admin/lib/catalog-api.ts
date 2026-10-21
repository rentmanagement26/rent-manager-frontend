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

// Creates a limit for something the system can count (see `availableMetrics` in the catalog).
export function createLimit(token: string, input: { metricKey: string; displayName: string; mayStayWhenLowered: boolean }) {
  return send<{ id: number }>("POST", `${CATALOG}/limits`, token, {
    MetricKey: input.metricKey,
    DisplayName: input.displayName || null,
    MayStayWhenLowered: input.mayStayWhenLowered,
  });
}

// Renames a limit and/or changes whether landlords may stay when it is lowered (future plan changes only).
export function updateLimitType(
  token: string,
  limitTypeId: number,
  input: { displayName: string; mayStayWhenLowered: boolean },
) {
  return send<null>("PUT", `${CATALOG}/limits/${limitTypeId}`, token, {
    DisplayName: input.displayName,
    MayStayWhenLowered: input.mayStayWhenLowered,
  });
}
