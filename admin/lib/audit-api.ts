import { backendFetch } from "@/lib/api-client";
import type { ApiResult, AuditLogPage, AuditOutcome, AuditSettings } from "@/lib/types";

async function getJson<T>(path: string, token: string): Promise<ApiResult<T>> {
  try {
    const response = await backendFetch(path, token, { cache: "no-store" });
    if (response.status === 401) return { status: "expired" };
    if (response.status === 403) return { status: "forbidden" };
    if (!response.ok) return { status: "error" };
    return { status: "ok", data: (await response.json()) as T };
  } catch {
    return { status: "error" };
  }
}

export function getAuditSettings(token: string) {
  return getJson<AuditSettings>("/api/v1/admin/audit-settings", token);
}

export interface AuditLogQuery {
  outcome?: AuditOutcome;
  module?: string;
  source?: string;
  from?: Date;
  to?: Date;
  beforeId?: number;
  limit?: number;
}

export function getAuditLogs(token: string, query: AuditLogQuery = {}) {
  const params = new URLSearchParams();
  if (query.outcome) params.set("outcome", query.outcome);
  if (query.module) params.set("module", query.module);
  if (query.source) params.set("source", query.source);
  if (query.from) params.set("from", query.from.toISOString());
  if (query.to) params.set("to", query.to.toISOString());
  if (query.beforeId) params.set("beforeId", String(query.beforeId));
  params.set("limit", String(query.limit ?? 50));
  return getJson<AuditLogPage>(`/api/v1/admin/audit-logs?${params}`, token);
}
