// Backend calls for the Customers page: list, one customer, and switching an account on or off.
import { getJson } from "@/lib/api-client";
import { send } from "@/lib/staff-api";
import type { CustomerDetail, CustomerPage } from "@/lib/types";

const BASE = "/api/v1/admin/customers";

export interface CustomerQuery {
  search?: string;
  // "Landlord", "Tenant" or "Contractor"; leave out for all.
  role?: string;
  // "active" or "inactive"; leave out for all.
  status?: string;
  // "created", "name" or "email".
  sort?: string;
  direction?: "asc" | "desc";
  page?: number;
}

// One page of customers (25 per page), filtered and sorted by the backend.
export function getCustomers(token: string, query: CustomerQuery = {}) {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.role) params.set("role", query.role);
  if (query.status) params.set("status", query.status);
  params.set("sort", query.sort ?? "created");
  params.set("direction", query.direction ?? "desc");
  params.set("page", String(query.page ?? 1));
  params.set("pageSize", "25");
  return getJson<CustomerPage>(`${BASE}?${params}`, token);
}

// One customer with the details the list leaves out (phone, locked out, profile links).
export function getCustomer(token: string, userId: string) {
  return getJson<CustomerDetail>(`${BASE}/${encodeURIComponent(userId)}`, token);
}

// Switches a customer's account off (signed out everywhere, cannot sign in; data kept) or back on.
export function setCustomerActive(token: string, userId: string, active: boolean) {
  return send<null>("POST", `${BASE}/${encodeURIComponent(userId)}/${active ? "reactivate" : "deactivate"}`, token);
}
