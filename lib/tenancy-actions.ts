"use server";

// Server actions for the landlord's tenancy pages: save the lease details and end a co-tenant's stay.
import { redirect } from "next/navigation";
import { requireBackendToken } from "@/lib/auth-guard";
import { SessionExpiredError } from "@/lib/api-error";
import { endCoTenant, getTenancy, saveLeaseDetails } from "@/lib/tenancy-api";
import type { LeaseDetailsInput, TenancyDetails } from "@/lib/tenancy-types";

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

// Saves the lease details from inside the Add lease stepper and answers the saved details, so the landlord stays on the page.
export async function saveLeaseDetailsInlineAction(
  tenancyId: number,
  input: LeaseDetailsInput
): Promise<{ details: TenancyDetails } | { error: string; expired: boolean }> {
  const session = await requireBackendToken(["Admin", "Landlord"]);
  try {
    await saveLeaseDetails(session.backendToken, Number(tenancyId), input);
    const details = await getTenancy(session.backendToken, Number(tenancyId));
    return details ? { details } : { error: "The lease was saved but could not be reloaded.", expired: false };
  } catch (err) {
    if (err instanceof SessionExpiredError) return { error: err.message, expired: true };
    return { error: err instanceof Error ? err.message : "Couldn't save the lease details. Please try again.", expired: false };
  }
}

// Loads one lease's details for the Add lease stepper after the landlord picks a unit. Answers { details } or { error }.
export async function loadTenancyDetailsAction(tenancyId: number): Promise<{ details: TenancyDetails } | { error: string; expired: boolean }> {
  const session = await requireBackendToken(["Admin", "Landlord"]);
  try {
    const details = await getTenancy(session.backendToken, Number(tenancyId));
    return details ? { details } : { error: "That lease was not found.", expired: false };
  } catch (err) {
    if (err instanceof SessionExpiredError) return { error: err.message, expired: true };
    return { error: err instanceof Error ? err.message : "Couldn't load the lease.", expired: false };
  }
}
