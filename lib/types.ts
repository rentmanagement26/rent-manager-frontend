export type AppRole = "Admin" | "Landlord" | "Tenant" |  "Contractor";

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  role: AppRole;
  backendToken?: string;
  backendTokenExpiresAt?: string;
  refreshToken?: string;
  refreshTokenExpiresAt?: string;
}

export interface Tenant {
  id: string;
  name: string;
  email: string;
  phonenumber: number;
}

export interface PropertyType {
  id: number;
  name: string;
}

export interface CreatePropertyInput {
  name: string;
  propertyTypeId: number;
  line1: string;
  line2: string | null;
  city: string;
  region: string;
  postalCode: string;
  country: string;
}

export interface Property {
  id: number;
  name: string;
  propertyType: string;
  line1: string;
  line2: string | null;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  units: Unit[];
}

export interface Unit {
  id: number;
  label: string;
  unitType: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  askingRent: number;
  status: string;
}

export interface UnitType {
  id: number;
  name: string;
}

export interface CreateUnitInput {
  unitTypeId: number;
  label: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  askingRent: number;
}

export interface UpdateUnitInput {
  unitTypeId: number;
  label: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  askingRent: number;
  status: string;
}

export interface MediaItem {
  id: number;
  url: string;
  sortOrder: number;
  isCover: boolean;
}

export interface TenantInvitePreview {
  email: string;
  landlordName: string;
  unitLabel: string;
  propertyName: string;
  addressLine: string;
  expiresAt: string;
  isExpired: boolean;
  isUsed: boolean;
}

export interface CreateTenantInviteResult {
  token: string;
  inviteUrl: string;
  expiresAt: string;
}

export interface TenantInviteListItem {
  id: number;
  email: string;
  unitLabel: string;
  propertyName: string;
  createdAt: string;
  expiresAt: string;
  status: "Pending" | "Accepted" | "Declined" | "Expired";
}

export interface BackendAuthResponse {
  token: string;
  expiresAt: string;
  userId: string;
  email: string;
  fullName: string;
  roles: AppRole[];
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

// Rent is deliberately not modelled: the backend sends the unit's asking rent, not what this
// tenant agreed to pay, so showing it would misstate (and appear to change) their rent.
export interface TenantTenancy {
  tenancyId: number;
  status: "Active" | "Ended";
  startDate: string;
  endDate: string | null;
  unit: {
    unitId: number;
    label: string;
    bedrooms: number | null;
    bathrooms: number | null;
    squareFeet: number | null;
  };
  property: {
    propertyId: number;
    name: string;
    line1: string;
    line2: string | null;
    city: string;
    region: string;
    postalCode: string;
  };
  landlord: {
    name: string;
    businessName: string | null;
    email: string | null;
  } | null;
}

export interface NotificationItem {
  id: number;
  type: string;
  title: string;
  body: string;
  data: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface UserProfile {
  firstName: string;
  middleName: string | null;
  lastName: string;
  fullName: string;
  email: string;
}

export interface ActionFailure {
  error: string;
  expired: boolean;
}

export interface TwoFactorStatus {
  enabled: boolean;
  recoveryCodesRemaining: number;
}

export interface TwoFactorEnabledResult {
  auth: BackendAuthResponse;
  recoveryCodes: string[];
}

export interface TenantInviteStats {
  sent: number;
  pending: number;
  accepted: number;
  declined: number;
  expired: number;
}

export interface RegisterTenantInput {
  token: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  password: string;
}

export interface RegisterTenantResult {
  message: string;
  userId: string;
  email: string;
}

// ---- Plan proposals from support (the landlord approves or declines) ---------------------------------------

export interface PlanSnapshot {
  packageId: number;
  name: string;
  monthlyPrice: number;
}

// A limit that differs between the current and proposed plan. A null from/to means unlimited.
export interface PlanLimitChange {
  key: string;
  displayName: string;
  from: number | null;
  to: number | null;
}

// One plan change the landlord has been told about and not settled (GET /subscription/changes).
// `kind` is "proposal" (approve or decline) or "notice" (their plan is being updated).
export interface PendingPlanChange {
  id: number;
  kind: "proposal" | "notice";
  message: string | null;
  sentAt: string;
  // For a notice: when the update applies (null when they may stay as they are), whether they can stay (show Keep my plan)
  // and whether they can take the update today (show Move now; never for a price rise). For a proposal: when it runs out.
  effectiveDate: string | null;
  mayStay: boolean;
  canMoveNow: boolean;
  expiresAt: string | null;
  current: PlanSnapshot;
  target: PlanSnapshot;
  changes: {
    price: { from: number; to: number } | null;
    limits: PlanLimitChange[];
    featuresAdded: { key: string; displayName: string }[];
    featuresRemoved: { key: string; displayName: string }[];
  };
}

// ---- Billing: the landlord's own plan (GET /api/v1/subscription, /subscription/packages) ----------------------------

export interface MySubscription {
  hasPlan: boolean;
  packageId: number | null;
  packageName: string | null;
  monthlyPrice: number | null;
  status: string | null;
  startedAt: string | null;
  // `limit` already includes any extra allowance support granted.
  limits: { key: string; displayName: string; limit: number; used: number }[];
  features: { key: string; displayName: string }[];
}

// One plan the landlord can choose (newest terms only).
export interface AvailablePlan {
  packageId: number;
  name: string;
  monthlyPrice: number;
  isCurrent: boolean;
  limits: { key: string; displayName: string; value: number }[];
  features: { key: string; displayName: string }[];
}

// POST /subscription/preview-change: what a change would do, before it happens.
export interface PlanChangePreview {
  found: boolean;
  alreadyOnPlan: boolean;
  canChange: boolean;
  direction: string | null;
  packageName: string | null;
  violations: { limitKey: string; displayName: string; limit: number; used: number }[];
}
