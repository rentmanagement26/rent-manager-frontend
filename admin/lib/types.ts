export const ADMIN_ROLES = ["SuperAdmin", "Support", "Billing"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export function isAdminRole(role: string | undefined): role is AdminRole {
  return !!role && (ADMIN_ROLES as readonly string[]).includes(role);
}

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  role: AdminRole;
  backendToken?: string;
  backendTokenExpiresAt?: string;
  refreshToken?: string;
  refreshTokenExpiresAt?: string;
}

export interface BackendAuthResponse {
  token: string;
  expiresAt: string;
  userId: string;
  email: string;
  fullName: string;
  roles: string[];
  refreshToken: string;
  refreshTokenExpiresAt: string;
}

export interface TwoFactorChallenge {
  setupRequired: boolean;
  twoFactorToken: string;
}

export interface TwoFactorEnrollment {
  sharedKey: string;
  authenticatorUri: string;
}

export interface TwoFactorEnabledResult {
  auth: BackendAuthResponse;
  recoveryCodes: string[];
}

// Server actions return this (not a thrown error) so the client can narrow with `"error" in result`.
export interface ActionFailure {
  error: string;
  expired: boolean;
}

export type AuditOutcome = "Success" | "Failure" | "Warning";
export type AuditMode = "Disabled" | "Summary" | "Full";

export interface AuditLogEntry {
  id: number;
  occurredAt: string;
  requestId: string | null;
  actorEmail: string | null;
  actorRoles: string | null;
  ipAddress: string | null;
  source: string | null;
  module: string;
  action: string;
  outcome: AuditOutcome;
  entityType: string | null;
  entityId: string | null;
  summary: string;
  changes: string | null;
}

export interface AuditLogPage {
  items: AuditLogEntry[];
  nextBeforeId: number | null;
}

export interface AuditSettingItem {
  action: string;
  module: string;
  mode: AuditMode;
  defaultMode: AuditMode;
  isProtected: boolean;
  controlledBy: string;
  entriesLast30Days: number;
}

export interface AuditOverride {
  key: string;
  mode: AuditMode;
  updatedAt: string;
  updatedByUserId: string | null;
}

export interface AuditSettings {
  actions: AuditSettingItem[];
  overrides: AuditOverride[];
}

// What a console data call gives back, so pages can show a friendly state instead of crashing.
export type ApiResult<T> =
  | { status: "ok"; data: T }
  | { status: "forbidden" }
  | { status: "expired" }
  | { status: "error" };
