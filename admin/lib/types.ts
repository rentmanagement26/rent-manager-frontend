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

export interface TwoFactorStatus {
  enabled: boolean;
  recoveryCodesRemaining: number;
}

// ---- Plans (subscriptions) ----------------------------------------------------------------------------------

export interface PackageLimit {
  key: string; // e.g. "properties"
  displayName: string;
  value: number;
}

export interface PackageFeature {
  key: string;
  displayName: string;
}

// One plan as the catalog (GET /admin/packages) returns it: the current version's price, limits and features.
export interface AdminPackage {
  packageId: number;
  name: string;
  isActive: boolean;
  isDefault: boolean;
  sortOrder: number;
  packageVersionId: number;
  version: number;
  monthlyPrice: number;
  limits: PackageLimit[];
  features: PackageFeature[];
}

// One row of the landlords list (GET /admin/landlords). planName/planStatus are null for a landlord with no plan.
export interface LandlordListItem {
  landlordProfileId: number;
  name: string;
  businessName: string | null;
  email: string | null;
  isActive: boolean;
  createdAt: string;
  planName: string | null;
  planStatus: string | null;
}

export interface LandlordPage {
  items: LandlordListItem[];
  nextBeforeId: number | null;
}

// A limit of the landlord's CURRENT plan with how much they have used. `limit` already includes any
// extra allowance support granted through an override.
export interface PlanLimitUsage {
  key: string;
  displayName: string;
  limit: number;
  used: number;
}

export interface LandlordSubscription {
  hasPlan: boolean;
  packageId: number | null;
  packageName: string | null;
  monthlyPrice: number | null;
  status: string | null;
  startedAt: string | null;
  limits: PlanLimitUsage[];
  features: PackageFeature[];
}

// GET /admin/landlords/{id}/subscription
export interface AdminLandlordSubscription {
  landlord: { landlordProfileId: number; name: string; businessName: string | null; email: string | null };
  subscription: LandlordSubscription;
}

// The reason codes the backend accepts for an admin plan change (SubscriptionReasonCodes.cs).
export const PLAN_CHANGE_REASONS = [
  { code: "goodwill", label: "Goodwill" },
  { code: "support_fix", label: "Support fix" },
  { code: "trial", label: "Trial" },
  { code: "migration", label: "Migration" },
  { code: "other", label: "Other" },
] as const;
export type PlanChangeReasonCode = (typeof PLAN_CHANGE_REASONS)[number]["code"];

// A limit the landlord's usage would break on the new plan.
export interface LimitViolation {
  limitKey: string;
  displayName: string;
  limit: number;
  used: number;
}

// What the "change plan" server action answers when it fails: ActionFailure plus the backend's stable
// error code and, for "over_limits", the limits that were broken.
export interface ChangePlanFailure extends ActionFailure {
  code?: string;
  violations?: LimitViolation[];
}
