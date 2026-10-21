// Backend call for the Overview numbers: landlord totals, plans, customers by role and the admin team.
import { getJson } from "@/lib/api-client";
import type { AdminDashboard } from "@/lib/types";

export function getDashboard(token: string) {
  return getJson<AdminDashboard>("/api/v1/admin/dashboard", token);
}
