import { getJson } from "@/lib/api-client";
import { send } from "@/lib/staff-api";
import type { RolesOverview } from "@/lib/types";

// Calls for the Roles page: what each staff role may do. SuperAdmin only (the backend's roles.manage permission).

const ROLES = "/api/v1/admin/roles";

// Every staff role with its permissions and member count, plus the full permission catalogue.
export function getRoles(token: string) {
  return getJson<RolesOverview>(ROLES, token);
}

// Replaces the permissions of Support or Billing. Needs a fresh code from the admin's authenticator app.
export function setRolePermissions(token: string, role: string, permissions: string[], code: string) {
  return send<{ role: string; permissions: string[] }>("PUT", `${ROLES}/${encodeURIComponent(role)}/permissions`, token, {
    Permissions: permissions,
    Code: code,
  });
}
