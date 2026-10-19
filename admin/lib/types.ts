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
  // true when the account signed in with a temporary password and must choose a new one first.
  passwordChangeRequired?: boolean;
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
  // The landlord's sign-in account id (needed to reset their 2FA). Absent on an older backend.
  userId?: string;
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

// An extra allowance (or feature) support granted to one landlord on top of their plan.
// kind "limit":   effect looks like "+5" (five more of that limit).
// kind "feature": effect is "granted" (switched on) or "removed" (switched off).
export interface ActiveOverride {
  kind: "feature" | "limit";
  key: string;
  displayName: string;
  effect: string;
  startsAt: string;
  expiresAt: string | null; // null = never expires
}

// GET /admin/landlords/{id}/subscription
export interface AdminLandlordSubscription {
  // userId and isActive are absent on a backend that has not been updated yet.
  landlord: {
    landlordProfileId: number;
    userId?: string;
    name: string;
    businessName: string | null;
    email: string | null;
    isActive?: boolean;
  };
  subscription: LandlordSubscription;
  overrides: ActiveOverride[];
}

// ---- Admin team (staff accounts) ----------------------------------------------------------------------------

// One row of GET /admin/staff.
export interface StaffMember {
  userId: string;
  name: string;
  email: string | null;
  roles: string[];
  // "Active", "Invited" (temporary password not used yet), "Expired" (temporary password ran out) or "Disabled".
  status: string;
  twoFactorEnabled: boolean;
  createdAt: string;
  temporaryPasswordExpiresAt: string | null;
}

// Answer to creating a staff account or resetting a password/2FA. Shown to the admin ONCE and never stored.
export interface TemporaryPassword {
  userId: string;
  temporaryPassword: string;
  expiresAt: string;
}

// Why an admin resets someone's two-factor (TwoFactorResetReasons.cs). The backend also needs a written note.
export const TWO_FACTOR_RESET_REASONS = [
  { code: "lost_device", label: "Lost device" },
  { code: "new_device", label: "New device" },
  { code: "suspected_compromise", label: "Suspected compromise" },
  { code: "other", label: "Other" },
] as const;
export type TwoFactorResetReason = (typeof TWO_FACTOR_RESET_REASONS)[number]["code"];

// One entry of a landlord's plan history (GET /admin/landlords/{id}/subscription/history).
export interface SubscriptionHistoryItem {
  id: number;
  occurredAt: string;
  eventType: string; // what happened, as the backend names it
  fromPackage: string | null; // plan name before the change (null for the first plan)
  toPackage: string | null; // plan name after the change
  reasonCode: string | null; // why an admin made the change
  note: string | null; // free text the admin wrote
}

export interface SubscriptionHistoryPage {
  items: SubscriptionHistoryItem[];
  nextBeforeId: number | null; // pass as beforeId to load older entries
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

// ---- Roles and permissions (GET /api/v1/admin/roles) --------------------------------------------------------

// One staff role with the permissions it holds today. SuperAdmin is never editable and holds everything.
export interface RoleInfo {
  name: string;
  editable: boolean;
  hasAllPermissions: boolean;
  permissions: string[];
  members: number;
}

// One permission in the catalogue. `area` is the part before the dot, e.g. "landlords" for "landlords.view".
// SuperAdmin-only permissions can never be given to another role.
export interface PermissionInfo {
  key: string;
  area: string;
  description: string;
  superAdminOnly: boolean;
}

export interface RolesOverview {
  roles: RoleInfo[];
  permissions: PermissionInfo[];
}

// ---- Catalog (GET /api/v1/admin/catalog) --------------------------------------------------------------------

// A yes/no capability a plan can include. `usedByPackages` counts the current plan versions that include it.
export interface CatalogFeature {
  id: number;
  key: string;
  displayName: string;
  description: string | null;
  usedByPackages: number;
}

// A numeric cap a plan can set. `usageCounted` is true when the backend really counts a landlord's usage for it.
export interface CatalogLimit {
  id: number;
  key: string;
  displayName: string;
  usedByPackages: number;
  usageCounted: boolean;
}

export interface Catalog {
  features: CatalogFeature[];
  limits: CatalogLimit[];
}
