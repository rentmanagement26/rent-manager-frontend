// Backend calls for tenancies: the landlord's lease details and co-tenants, and the tenant's own lease.
import { backendFetch } from "@/lib/api-client";
import { SessionExpiredError, extractErrorMessage } from "@/lib/api-error";
import type { LeaseDetailsInput, TenancyDetails, TenancyListItem } from "@/lib/tenancy-types";

const BASE = "/api/v1/tenancies";

// The tenancy endpoints answer errors as { code, message }; other errors fall back to the shared reader.
async function errorText(response: Response): Promise<string> {
  try {
    const body = (await response.clone().json()) as { message?: string };
    if (typeof body.message === "string" && body.message) return body.message;
  } catch {
    // Not JSON: use the shared reader below.
  }
  return extractErrorMessage(response);
}

// A dead session becomes SessionExpiredError; other failures carry the backend's message.
async function readJson<T>(response: Response): Promise<T> {
  if (response.status === 401) throw new SessionExpiredError();
  if (!response.ok) throw new Error(await errorText(response));
  return response.json();
}

// Same checks for calls that answer no body.
async function expectOk(response: Response): Promise<void> {
  if (response.status === 401) throw new SessionExpiredError();
  if (!response.ok) throw new Error(await errorText(response));
}

// The landlord's tenancies for one unit (active only by default), newest first.
export async function getTenanciesForUnit(token: string, unitId: number): Promise<TenancyListItem[]> {
  const response = await backendFetch(`${BASE}?unitId=${unitId}&pageSize=10`, token, { cache: "no-store" });
  const page = await readJson<{ items: TenancyListItem[] }>(response);
  return page.items;
}

// One tenancy with its lease details and everyone who has been on it. Null when it is not found.
export async function getTenancy(token: string, tenancyId: number): Promise<TenancyDetails | null> {
  const response = await backendFetch(`${BASE}/${tenancyId}`, token, { cache: "no-store" });
  if (response.status === 404) return null;
  return readJson<TenancyDetails>(response);
}

export async function saveLeaseDetails(token: string, tenancyId: number, input: LeaseDetailsInput): Promise<void> {
  const response = await backendFetch(`${BASE}/${tenancyId}/lease-details`, token, {
    method: "PUT",
    body: JSON.stringify({
      MonthlyRent: input.monthlyRent,
      TermType: input.termType,
      StartDate: input.startDate,
      EndDate: input.endDate,
      RentDueDay: input.rentDueDay,
      SecurityDeposit: input.securityDeposit,
      PetDeposit: input.petDeposit,
      Utilities: input.utilities.map((u) => ({ Utility: u.utility, Responsibility: u.responsibility })),
      Charges: input.charges.map((c) => ({
        Type: c.type,
        Description: c.description,
        Amount: c.amount,
        Frequency: c.frequency,
        StartsOn: c.startsOn,
        EndsOn: c.endsOn,
      })),
    }),
  });
  await expectOk(response);
}

// A co-tenant leaves. leftOn is a date like 2026-12-31 (the backend stores it as that day in UTC); null means today.
export async function endCoTenant(token: string, tenancyId: number, tenantProfileId: number, leftOn: string | null): Promise<void> {
  const response = await backendFetch(`${BASE}/${tenancyId}/tenants/${tenantProfileId}/end`, token, {
    method: "POST",
    body: JSON.stringify({ LeftOn: leftOn }),
  });
  await expectOk(response);
}

// The tenant's own view of a tenancy they are on now. Null when they are not on it.
export async function getMyLease(token: string, tenancyId: number): Promise<TenancyDetails | null> {
  const response = await backendFetch(`/api/v1/tenants/me/tenancies/${tenancyId}`, token, { cache: "no-store" });
  if (response.status === 404) return null;
  return readJson<TenancyDetails>(response);
}
