// Backend call for the landlord's Activity page: what happened on their account, newest first.
import { backendFetch } from "@/lib/api-client";
import { SessionExpiredError } from "@/lib/api-error";
import type { ActivityPage } from "@/lib/types";

export interface ActivityQuery {
  // An audit module such as "subscription" or "auth"; leave out for every area.
  module?: string;
  // Only entries from the last N days.
  days?: number;
  // Pages to older entries.
  beforeId?: number;
}

const PAGE_SIZE = 25;

export async function getActivity(token: string, query: ActivityQuery): Promise<ActivityPage> {
  const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
  if (query.module) params.set("module", query.module);
  if (query.days) params.set("from", new Date(Date.now() - query.days * 24 * 60 * 60 * 1000).toISOString());
  if (query.beforeId) params.set("beforeId", String(query.beforeId));

  const response = await backendFetch(`/api/v1/activity?${params}`, token, { cache: "no-store" });
  if (response.status === 401) throw new SessionExpiredError();
  if (!response.ok) throw new Error("Couldn't load your activity.");
  return response.json();
}
