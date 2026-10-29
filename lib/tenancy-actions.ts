"use server";

// Server actions for the landlord's tenancy pages: save the lease details and end a co-tenant's stay.
import { redirect } from "next/navigation";
import { requireBackendToken } from "@/lib/auth-guard";
import { SessionExpiredError } from "@/lib/api-error";
import { endCoTenant, saveLeaseDetails } from "@/lib/tenancy-api";
import type { LeaseDetailsInput } from "@/lib/tenancy-types";

// The lease form sends everything as one JSON field so the repeated utility and charge rows stay together.
export async function saveLeaseDetailsAction(formData: FormData) {
  const session = await requireBackendToken(["Admin", "Landlord"]);
  const tenancyId = Number(formData.get("tenancyId") ?? 0);

  try {
    const input = JSON.parse(String(formData.get("payload") ?? "")) as LeaseDetailsInput;
    await saveLeaseDetails(session.backendToken, tenancyId, input);
  } catch (err) {
    if (err instanceof SessionExpiredError) redirect("/session-expired");
    const message = err instanceof Error ? err.message : "Couldn't save the lease details. Please try again.";
    redirect(`/landlord/tenancies/${tenancyId}/edit?error=${encodeURIComponent(message)}`);
  }

  redirect(`/landlord/tenancies/${tenancyId}?saved=1`);
}

// A co-tenant leaves the lease. The primary tenant cannot be ended (the backend refuses it).
export async function endCoTenantAction(formData: FormData) {
  const session = await requireBackendToken(["Admin", "Landlord"]);
  const tenancyId = Number(formData.get("tenancyId") ?? 0);
  const tenantProfileId = Number(formData.get("tenantProfileId") ?? 0);
  const leftOn = String(formData.get("leftOn") ?? "").trim();

  try {
    await endCoTenant(session.backendToken, tenancyId, tenantProfileId, leftOn === "" ? null : leftOn);
  } catch (err) {
    if (err instanceof SessionExpiredError) redirect("/session-expired");
    const message = err instanceof Error ? err.message : "Couldn't end that stay. Please try again.";
    redirect(`/landlord/tenancies/${tenancyId}?error=${encodeURIComponent(message)}`);
  }

  redirect(`/landlord/tenancies/${tenancyId}?ended=1`);
}
