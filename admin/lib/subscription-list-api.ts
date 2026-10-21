// The landlords list filtered by plan, terms and plan-change status (GET /admin/subscriptions). It only holds landlords that are on a plan.
import { getJson } from "@/lib/api-client";
import type { SubscriptionListPage } from "@/lib/types";

export interface SubscriptionListQuery {
  search?: string;
  planId?: number;
  // "older" or "newest" terms.
  terms?: string;
  // "told", "queued", "chose_to_stay", "proposed" or "none".
  status?: string;
  page?: number;
}

export function getSubscriptionList(token: string, query: SubscriptionListQuery) {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.planId) params.set("planId", String(query.planId));
  if (query.terms) params.set("terms", query.terms);
  if (query.status) params.set("status", query.status);
  params.set("page", String(query.page ?? 1));
  params.set("pageSize", "25");
  return getJson<SubscriptionListPage>(`/api/v1/admin/subscriptions?${params}`, token);
}
