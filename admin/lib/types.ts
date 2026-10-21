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
  // Landlords on any version of this plan, and how many of them are not on the current version.
  // Absent on a backend that has not been updated yet.
  landlords?: number;
  landlordsOnOlderVersions?: number;
}

// One version of a plan (GET /admin/packages/{id}): its price, limits, features and how many landlords are on it.
export interface PackageVersionDetail {
  packageVersionId: number;
  version: number;
  isCurrent: boolean;
  monthlyPrice: number;
  createdAt: string;
  landlords: number;
  limits: PackageLimit[];
  features: PackageFeature[];
  // When older terms end (everyone still on them moves to the newest terms on the first billing date on or after it), null for none.
  termsEndAt?: string | null;
  // Landlords on these terms who were told about a newer version and chose to stay.
  landlordsChoseToStay?: number;
}

// A plan with every version it has had, newest first.
export interface AdminPackageDetail {
  packageId: number;
  name: string;
  isActive: boolean;
  isDefault: boolean;
  sortOrder: number;
  versions: PackageVersionDetail[];
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
  id?: number; // absent on a backend that has not been updated yet
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
  // Plan changes planned for or proposed to this landlord, newest first (absent on an older backend).
  changes?: AdminScheduledChange[];
}

// One proposal or rollout for a landlord. `kind` is "proposal" or "rollout"; `status` is Pending (queued, landlord not told yet),
// Notified (told), Applied, Declined (for a rollout: they chose to stay), Skipped, Cancelled, Expired or Failed.
export interface AdminScheduledChange {
  id: number;
  kind: "proposal" | "rollout";
  rule: string | null;
  status: string;
  targetPackageName: string;
  fromTermsNumber: number;
  targetTermsNumber: number;
  dueAt: string | null;
  noticeSentAt: string | null;
  createdAt: string;
  resolvedAt: string | null;
  message: string | null;
  staffNote: string | null;
  failureReason: string | null;
  expiresAt: string | null;
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

// ---- Plan proposals (the customer must approve every plan change) -------------------------------------------

// A proposal sent to a landlord that they have not answered yet (from GET /admin/subscriptions?status=proposed).
export interface AwaitingProposal {
  landlordProfileId: number;
  landlordName: string;
  changeId: number;
  // When the proposal runs out (null = no end). Expired proposals are left out of the list by the backend.
  expiresAt: string | null;
}

// Outcome of sending one proposal, as the backend names it.
export type ProposalOutcome = "proposed" | "over_limits" | "already_there" | "no_plan" | "not_found";

// Answer to sending a proposal to one landlord. `violations` lists the limits that stop them accepting.
export interface SendProposalResult {
  outcome: ProposalOutcome;
  message: string | null;
  changeId: number | null;
  violations: LimitViolation[];
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
  // When a new plan version only lowers this limit, landlords may stay on their current plan.
  mayStayWhenLowered: boolean;
}

// Something the system can count that has no limit yet. An admin can create a limit for it.
export interface CatalogMetric {
  key: string;
  displayName: string;
  description: string;
}

export interface Catalog {
  features: CatalogFeature[];
  limits: CatalogLimit[];
  availableMetrics: CatalogMetric[];
}

// ---- Landlord overrides (GET /api/v1/admin/landlords/{id}/overrides) -----------------------------------------

// One extra allowance ("limit") or feature switch ("feature") an admin gave one landlord on top of their plan.
// `effect` is "+5" for a limit, or "granted" / "removed" for a feature. `status` is Active, Scheduled, Expired or Revoked.
export interface LandlordOverride {
  id: number;
  kind: "limit" | "feature";
  key: string;
  displayName: string;
  effect: string;
  status: "Active" | "Scheduled" | "Expired" | "Revoked";
  reasonCode: string | null;
  note: string | null;
  startsAt: string;
  expiresAt: string | null;
  createdAt: string;
  createdBy: string | null;
  revokedAt: string | null;
  revokedBy: string | null;
  revokedReason: string | null;
}

// ---- Customers (landlords, tenants and contractors; GET /api/v1/admin/customers) ---------------------------

export type CustomerRole = "Landlord" | "Tenant" | "Contractor";

// One row of the customers list. Only what the list needs (data minimization): no phone number here.
export interface CustomerListItem {
  userId: string;
  name: string;
  email: string | null;
  roles: string[];
  isActive: boolean;
  emailConfirmed: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
  landlordProfileId: number | null;
  // The landlord's business name or the contractor's company, when there is one.
  company: string | null;
}

export interface CustomerPage {
  items: CustomerListItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

// GET /admin/customers/{userId}
export interface CustomerDetail {
  userId: string;
  name: string;
  email: string | null;
  phoneNumber: string | null;
  roles: string[];
  isActive: boolean;
  emailConfirmed: boolean;
  twoFactorEnabled: boolean;
  lockedOut: boolean;
  createdAt: string;
  landlord: { landlordProfileId: number; businessName: string | null } | null;
  tenant: { tenantProfileId: number; landlordProfileId: number; landlordName: string | null } | null;
  contractor: { contractorProfileId: number; companyName: string | null; trade: string | null } | null;
}

// ---- Overview numbers (GET /api/v1/admin/dashboard) ----------------------------------------------------------

// `customers` and `staff` are left out of the answer when the signed-in admin lacks the permission for them.
export interface AdminDashboard {
  generatedAt: string;
  landlords: {
    total: number;
    active: number;
    switchedOff: number;
    newThisWeek: number;
    weekStartsAt: string;
    byPlan: { packageId: number; name: string; isActive: boolean; landlords: number; onOlderVersion: number }[];
    // Landlords with no plan yet (they get the default plan the first time they add something).
    noPlan: number;
    newPerWeek: { weekStart: string; count: number }[];
  };
  customers?: { roles: { role: string; total: number; active: number; switchedOff: number }[] };
  staff?: {
    active: number;
    switchedOff: number;
    temporaryPasswordPending: number;
    authenticatorNotSetUp: number;
    byRole: { role: string; count: number }[];
  };
}

// ---- Scheduled jobs (GET /api/v1/admin/jobs, SuperAdmin only) --------------------------------------------------

export interface AdminJobRun {
  id: number;
  trigger: string;
  instance: string;
  startedAt: string;
  finishedAt: string | null;
  status: string;
  summary: string | null;
  error: string | null;
}

// `nextDueAt` is null while a run is in progress; a time in the past means it is due now.
export interface AdminJob {
  name: string;
  description: string;
  schedule: string;
  isRunning: boolean;
  nextDueAt: string | null;
  lastRun: AdminJobRun | null;
}

// ---- Publish preview and terms end date (POST /admin/packages/{id}/versions/preview, PUT .../end-date) ------------

// What publishing would do to one group of existing landlords (all on the same older terms).
export interface PublishPreviewGroup {
  termsNumber: number;
  landlords: number;
  rule: string;
  noticeDays: number;
  mayStay: boolean;
  overNewLimits: number;
  changes: {
    price: { from: number; to: number } | null;
    limits: { key: string; displayName: string; from: number | null; to: number | null }[];
    featuresAdded: { key: string; displayName: string }[];
    featuresRemoved: { key: string; displayName: string }[];
  };
}

export interface PublishPreview {
  newTermsNumber: number;
  groups: PublishPreviewGroup[];
  totalLandlords: number;
  wouldBeNotified: number;
}

// Answer to setting or removing an end date for older terms.
export interface TermsEndResult {
  landlords: number;
  noticesQueued: number;
  replaced: number;
}

// ---- Proposals to several landlords, and the filtered landlords list --------------------------------------------

// One landlord in a proposal preview. `outcome`: can_propose, over_limits, already_there or not_found.
export interface BulkPreviewItem {
  landlordProfileId: number;
  name: string | null;
  businessName: string | null;
  fromPackageName: string | null;
  outcome: string;
  message: string | null;
  violations: LimitViolation[];
}

// POST /admin/subscriptions/proposals/preview: who could be offered a plan. Nothing is saved or sent.
export interface BulkProposalPreview {
  target: { packageId: number; name: string; isActive: boolean; termsNumber: number };
  summary: { canPropose: number; overLimits: number; alreadyThere: number; notFound: number };
  items: BulkPreviewItem[];
}

// POST /admin/subscriptions/proposals with several landlords: how many were sent and who was left out.
export interface BulkSendResult {
  summary: { proposed: number; overLimits: number; alreadyThere: number; noPlan: number; notFound: number };
  items: { landlordProfileId: number; name: string | null; outcome: string; message: string | null }[];
}

// One landlord of GET /admin/subscriptions (only landlords that are on a plan).
export interface SubscriptionListItem {
  landlordProfileId: number;
  userId: string | null;
  name: string;
  businessName: string | null;
  email: string | null;
  isActive: boolean;
  packageId: number;
  packageName: string;
  onOlderTerms: boolean;
  // `status` is told, queued or chose_to_stay.
  change: { id: number; status: string } | null;
  proposal: { id: number; expiresAt: string | null } | null;
}

export interface SubscriptionListPage {
  items: SubscriptionListItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}
