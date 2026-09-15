import { backendFetch } from "@/lib/api-client";
import { extractErrorMessage } from "@/lib/api-error";
import type {
  TenantInvitePreview,
  CreateTenantInviteResult,
  RegisterTenantInput,
  RegisterTenantResult,
} from "@/lib/types";

// --- Public (unauthenticated) ---

export async function getTenantInvitePreview(inviteToken: string): Promise<TenantInvitePreview> {
  const response = await fetch(
    `${process.env.BACKEND_API_URL}/api/v1/auth/tenant-invites/${encodeURIComponent(inviteToken)}`
  );
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }
  return response.json();
}

export async function registerTenant(input: RegisterTenantInput): Promise<RegisterTenantResult> {
  const response = await fetch(`${process.env.BACKEND_API_URL}/api/v1/auth/register/tenant`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      Token: input.token,
      FirstName: input.firstName,
      MiddleName: input.middleName,
      LastName: input.lastName,
      Password: input.password,
    }),
  });
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }
  return response.json();
}

// --- Authenticated ---

export async function createTenantInvite(
  email: string,
  unitId: number,
  token: string
): Promise<CreateTenantInviteResult> {
  const response = await backendFetch("/api/v1/auth/tenant-invites", token, {
    method: "POST",
    body: JSON.stringify({ Email: email, UnitId: unitId }),
  });
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }
  return response.json();
}

export async function acceptTenantInvite(inviteToken: string, token: string): Promise<{ message: string }> {
  const response = await backendFetch(
    `/api/v1/auth/tenant-invites/${encodeURIComponent(inviteToken)}/accept`,
    token,
    { method: "POST" }
  );
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }
  return response.json();
}