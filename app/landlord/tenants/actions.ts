"use server";

import { redirect } from "next/navigation";
import { requireBackendToken } from "@/lib/auth-guard";
import { createTenantInvite, resendTenantInvite } from "@/lib/tenant-invite-api";

export async function createTenantInviteAction(formData: FormData) {
  const session = await requireBackendToken(["Admin", "Landlord"]);
  const email = String(formData.get("email") ?? "");
  const unitId = Number(formData.get("unitId") ?? 0);

  try {
    await createTenantInvite(email, unitId, session.backendToken);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Couldn't send invite. Please try again.";
    redirect(`/landlord/tenants?error=${encodeURIComponent(message)}`);
  }

  redirect(`/landlord/tenants?sent=1&email=${encodeURIComponent(email)}`);
}

export async function resendTenantInviteAction(formData: FormData) {
  const session = await requireBackendToken(["Admin", "Landlord"]);
  const inviteId = Number(formData.get("inviteId") ?? 0);

  try {
    await resendTenantInvite(inviteId, session.backendToken);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Couldn't resend invite. Please try again.";
    redirect(`/landlord/tenants?error=${encodeURIComponent(message)}`);
  }

  redirect("/landlord/tenants?resent=1");
}