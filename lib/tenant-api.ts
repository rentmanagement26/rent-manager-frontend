import { backendFetch } from "@/lib/api-client";
import { SessionExpiredError, extractErrorMessage } from "@/lib/api-error";
import type { TenantTenancy } from "@/lib/types";

export async function getMyTenancies(token: string): Promise<TenantTenancy[]> {
  const response = await backendFetch("/api/v1/tenants/me/tenancies", token);
  if (response.status === 401) {
    throw new SessionExpiredError();
  }
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }
  return response.json();
}
