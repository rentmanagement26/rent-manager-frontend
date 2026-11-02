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

// GET /api/v1/billing: the Stripe side of the landlord's plan. When hasStripeSubscription is false the other fields are null.
export interface MyBilling {
  hasStripeSubscription: boolean;
  status: string | null; // from Stripe: trialing, active, past_due...
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  // True when paying for a plan now would start a free trial of `trialMonths` calendar months (3 Nov to 3 Dec).
  trialEligible: boolean;
  trialMonths: number;
  // A custom price an admin gave this landlord, or null.
  priceOverride: MyPriceOverride | null;
  // How they are billed now, whether the plan ends at the end of the period, a lower plan booked for the end of the period,
  // and how many days after a payment they may cancel for a full refund.
  interval: BillingInterval | null;
  cancelAtPeriodEnd: boolean;
  pendingPackageId: number | null;
  pendingChangeAt: string | null;
  refundWindowDays: number;
}

export type BillingInterval = "month" | "year";

// A custom price: a fixed monthly amount or a percent off, for `months` months or (null) for as long as they stay.
export interface MyPriceOverride {
  kind: "fixed_amount" | "percent_off";
  monthlyAmount: number | null;
  percentOff: number | null;
  months: number | null;
}

// One plan the landlord can choose (newest terms only).
export interface AvailablePlan {
  packageId: number;
  name: string;
  monthlyPrice: number;
  // The yearly price and what it saves against twelve monthly payments; both are null when the plan is not sold yearly.
  yearlyPrice?: number | null;
  yearlySavings?: number | null;
  isCurrent: boolean;
  limits: { key: string; displayName: string; value: number }[];
  features: { key: string; displayName: string }[];
}

// ---- Changing and cancelling a paid plan (POST /billing/change-preview, /change, /cancel). Money is in dollars. ----

export interface BillingPlanAmount {
  interval: BillingInterval;
  amount: number;
  currency: string | null;
}

// What happens if the change is made now: credit for the unused time, the charge for the rest of the period, and what is billed today.
export interface BillingChangeNow {
  creditForUnusedTime: number;
  chargeForRemainingTime: number;
  dueToday: number;
  // Credit that stays on the Stripe balance and is used on the next bill.
  creditToBalance: number;
}

export interface BillingChangePreview {
  inTrial: boolean;
  trialEndsAt: string | null;
  current: BillingPlanAmount | null;
  target: BillingPlanAmount | null;
  periodEnd: string | null;
  daysLeft: number;
  isIncrease: boolean;
  // "now" or "end_of_period"; the backend recommends one and allows one or both.
  recommendedTiming: BillingTiming | null;
  allowedTimings: BillingTiming[];
  now: BillingChangeNow | null;
  atPeriodEnd: { effectiveAt: string; newAmount: number; newInterval: BillingInterval } | null;
}

export type BillingTiming = "now" | "end_of_period";

// POST /billing/change-preview answers a change, or "cancel" when the target is a free plan (which is a cancellation).
export type BillingChangeAnswer =
  | { kind: "change"; targetName: string; preview: BillingChangePreview }
  | { kind: "cancel"; targetName: string };

// GET /billing/cancel-options: what cancelling does. `refundEligible` means they paid within the refund window.
export interface CancelOptions {
  hasSubscription: boolean;
  inTrial: boolean;
  accessUntil: string | null;
  alreadyCancelling: boolean;
  refundEligible: boolean;
  refundAmount: number;
  refundUntil: string | null;
  refundWindowDays: number;
}

// POST /billing/cancel: at_period_end (they keep the plan until accessUntil), now (a trial ended) or refunded.
export interface CancelResult {
  mode: "at_period_end" | "now" | "refunded";
  accessUntil: string | null;
  refundAmount: number;
}

// ---- Activity (GET /api/v1/activity): what happened on the landlord's account -----------------------------------

export interface ActivityItem {
  id: number;
  occurredAt: string;
  action: string;
  // A sentence ready to show, for example "Plan changed from Free to Basic".
  summary: string;
  entityType: string | null;
  entityId: string | null;
  // "You", "DomusPRO support", "System" or another person's email.
  actorLabel: string;
}

export interface ActivityPage {
  items: ActivityItem[];
  // Pass as beforeId to load older entries; null when there are none.
  nextBeforeId: number | null;
}
