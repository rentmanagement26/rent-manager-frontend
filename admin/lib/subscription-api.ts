import { getJson } from "@/lib/api-client";
import type {
  AdminLandlordSubscription,
  AdminPackage,
  AdminPackageDetail,
  LandlordPage,
  SubscriptionHistoryPage,
} from "@/lib/types";

const BASE = "/api/v1/admin";

// The plan catalog: every plan with its current price, limits and features.
export function getPackages(token: string) {
  return getJson<AdminPackage[]>(`${BASE}/packages`, token);
}

// One plan with every version it has had, and how many landlords are on each.
export function getPackageDetail(token: string, packageId: number) {
  return getJson<AdminPackageDetail>(`${BASE}/packages/${packageId}`, token);
}

// Landlords, newest first, each with their plan name and status. `beforeId` pages to older ones.
export function getLandlords(token: string, query: { search?: string; beforeId?: number; limit?: number } = {}) {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.beforeId) params.set("beforeId", String(query.beforeId));
  params.set("limit", String(query.limit ?? 25));
  return getJson<LandlordPage>(`${BASE}/landlords?${params}`, token);
}

// One landlord's plan, with usage against each limit.
export function getLandlordSubscription(token: string, landlordProfileId: number) {
  return getJson<AdminLandlordSubscription>(`${BASE}/landlords/${landlordProfileId}/subscription`, token);
}

// A landlord's plan changes (upgrades, downgrades, admin changes), newest first.
export function getLandlordHistory(token: string, landlordProfileId: number) {
  return getJson<SubscriptionHistoryPage>(`${BASE}/landlords/${landlordProfileId}/subscription/history?limit=50`, token);
}
