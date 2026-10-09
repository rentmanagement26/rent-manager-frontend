import { backendFetch } from "@/lib/api-client";
import { SessionExpiredError, extractErrorMessage } from "@/lib/api-error";
import type { ApiResult, AuditLogPage, AuditMode, AuditOutcome, AuditSettings } from "@/lib/types";

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

async function writeAuditSetting(path: string, token: string, init: RequestInit): Promise<void> {
  const response = await backendFetch(path, token, init);
  if (response.status === 401) throw new SessionExpiredError();
  if (response.status === 403) throw new Error("Your role can't change audit settings.");
  if (response.status === 429) throw new Error("Too many attempts. Wait a minute and try again.");
  if (!response.ok) throw new Error(await extractErrorMessage(response));
}

export function setAuditMode(token: string, key: string, mode: AuditMode) {
  return writeAuditSetting(`/api/v1/admin/audit-settings/${encodeURIComponent(key)}`, token, {
    method: "PUT",
    body: JSON.stringify({ Mode: mode }),
  });
}

export function removeAuditOverride(token: string, key: string) {
  return writeAuditSetting(`/api/v1/admin/audit-settings/${encodeURIComponent(key)}`, token, { method: "DELETE" });
}
