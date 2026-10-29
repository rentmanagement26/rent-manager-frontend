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
