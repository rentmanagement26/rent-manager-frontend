// Types for tenancies: lease details and the people on them (GET /tenancies, GET /tenants/me/tenancies/{id}).
// The backend returns enum names such as "TenantPays", "MonthToMonth" and "CoTenant"; lib/lease-format.ts turns them into words.

export interface TenancyUtility {
  utility: string;
  responsibility: string;
}

export interface TenancyCharge {
  id: number;
  type: string;
  description: string;
  amount: number;
  frequency: string;
  startsOn: string | null;
  endsOn: string | null;
}

export interface TenancyPerson {
  tenantProfileId: number;
  name: string | null;
  // Only the landlord gets emails.
  email: string | null;
  role: "Primary" | "CoTenant";
  joinedAt: string;
  leftAt: string | null;
}

// Where a lease stands on renewal. Only the landlord gets it. State is worked out from today's date: Upcoming, Due, Overdue or Decided.
export interface RenewalInfo {
  status: string;
  state: "Upcoming" | "Due" | "Overdue" | "Decided" | null;
  noticeDays: number | null;
  sendByDate: string | null;
  snoozedUntil: string | null;
  monthToMonthSince: string | null;
  previousEndDate: string | null;
}

// One row of the renewals list: a fixed-term lease that is ending, or one already past its end date with no decision.
export interface RenewalRow {
  tenancyId: number;
  unitId: number;
  endDate: string;
  sendByDate: string;
  daysToEnd: number;
  noticeDays: number;
  state: "Upcoming" | "Due" | "Overdue" | "Decided";
  // Pending, Offered, NotRenewing or MonthToMonth.
  decision: string;
  snoozedUntil: string | null;
}

export interface TenancyDetails {
  id: number;
  unitId: number;
  status: string;
  startDate: string;
  endDate: string | null;
  termType: "Fixed" | "MonthToMonth";
  monthlyRent: number | null;
  rentDueDay: number | null;
  securityDeposit: number | null;
  petDeposit: number | null;
  leaseDetailsUpdatedAt: string | null;
  utilities: TenancyUtility[];
  charges: TenancyCharge[];
  tenants: TenancyPerson[];
  // Landlord only; absent for tenants.
  renewal?: RenewalInfo | null;
}

export interface TenancyListItem {
  id: number;
  unitId: number;
  status: string;
  startDate: string;
  endDate: string | null;
  termType: string;
  monthlyRent: number | null;
  currentTenants: number;
  primaryTenantName: string | null;
}

// What the lease form sends (words use underscores, as the backend accepts).
export interface LeaseDetailsInput {
  monthlyRent: number | null;
  termType: "fixed" | "month_to_month";
  startDate: string;
  endDate: string | null;
  rentDueDay: number | null;
  securityDeposit: number | null;
  petDeposit: number | null;
  utilities: { utility: string; responsibility: string }[];
  charges: { type: string; description: string; amount: number; frequency: string; startsOn: string | null; endsOn: string | null }[];
}
