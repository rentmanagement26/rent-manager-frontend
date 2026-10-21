// What the signed-in admin may do, read live from the backend (GET /api/v1/admin/me) instead of guessed from their role name.
// The Roles page lets a SuperAdmin change what Support and Billing may do, so a role name alone is not reliable.
// The backend still enforces every permission; this only decides which buttons and sections to show.
import { cache } from "react";
import { getJson } from "@/lib/api-client";
import type { SessionUser } from "@/lib/types";

// The permission names the backend uses (SharedKernel/Security/Permissions.cs).
export const PERMISSIONS = {
  packagesManage: "packages.manage",
  catalogManage: "catalog.manage",
  overridesGrant: "overrides.grant",
  overridesRevoke: "overrides.revoke",
  subscriptionsChange: "subscriptions.change",
  subscriptionsOverride: "subscriptions.override",
  customersManage: "customers.manage",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

interface MeResponse {
  permissions: string[];
}

// Fetched once per page request even when several components ask.
const loadPermissions = cache(async (token: string): Promise<Set<string> | null> => {
  const result = await getJson<MeResponse>("/api/v1/admin/me", token);
  return result.status === "ok" ? new Set(result.data.permissions) : null;
});

// Returns `can(permission)` for the signed-in admin. A SuperAdmin holds every permission. If the backend can't be
// reached, everyone else gets false, so buttons are hidden rather than shown and then refused.
export async function getPermissions(session: SessionUser & { backendToken: string }) {
  const granted = await loadPermissions(session.backendToken);
  return {
    can: (permission: Permission) => session.role === "SuperAdmin" || (granted?.has(permission) ?? false),
  };
}
