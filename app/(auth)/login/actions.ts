"use server";

import { redirect } from "next/navigation";
import { extractErrorMessage } from "@/lib/api-error";
import { isSafeRedirectTarget } from "@/lib/auth-guard";
import { setTwoFactorCookie } from "@/lib/auth-session";
import type { TwoFactorChallenge } from "@/lib/types";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirect") ?? "");

  const response = await fetch(`${process.env.BACKEND_API_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ Email: email, Password: password }),
  });

  if (!response.ok) {
    const message = await extractErrorMessage(response);
    const params = new URLSearchParams({ error: message });
    if (isSafeRedirectTarget(redirectTo)) params.set("redirect", redirectTo);
    redirect(`/login?${params.toString()}`);
  }

  // The backend never returns a session from the password step: only a short-lived
  // token that is exchanged for one after the second factor.
  const challenge: TwoFactorChallenge = await response.json();
  await setTwoFactorCookie(challenge.twoFactorToken, challenge.setupRequired);

  const params = new URLSearchParams();
  if (isSafeRedirectTarget(redirectTo)) params.set("redirect", redirectTo);
  const query = params.size > 0 ? `?${params.toString()}` : "";
  redirect(`/login/two-factor/${challenge.setupRequired ? "setup" : "verify"}${query}`);
}
