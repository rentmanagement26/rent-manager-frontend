"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireBackendToken } from "@/lib/auth-guard";
import { registerTenant, acceptTenantInvite } from "@/lib/tenant-invite-api";

export async function registerTenantAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const firstName = String(formData.get("firstName") ?? "");
  const middleNameRaw = String(formData.get("middleName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "");
  const password = String(formData.get("password") ?? "");

  try {
    await registerTenant({
      token,
      firstName,
      middleName: middleNameRaw === "" ? null : middleNameRaw,
      lastName,
      password,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Couldn't create your account. Please try again.";
    redirect(`/register/tenant?token=${encodeURIComponent(token)}&error=${encodeURIComponent(message)}`);
  }

  const cookieStore = await cookies();
  cookieStore.set({
    name: "pending_tenant_invite",
    value: token,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 2,
  });

  redirect("/login?registered=1");
}

export async function acceptTenantInviteAction(formData: FormData) {
  const session = await requireBackendToken();
  const token = String(formData.get("token") ?? "");

  try {
    await acceptTenantInvite(token, session.backendToken);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Couldn't accept the invite. Please try again.";
    redirect(`/register/tenant?token=${encodeURIComponent(token)}&error=${encodeURIComponent(message)}`);
  }

  redirect(`/register/tenant?token=${encodeURIComponent(token)}&accepted=1`);
}