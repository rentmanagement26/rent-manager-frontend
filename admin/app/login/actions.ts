"use server";

import { redirect } from "next/navigation";
import { setTwoFactorCookie } from "@/lib/auth-session";
import type { TwoFactorChallenge } from "@/lib/types";

const GENERIC_ERROR = "Email or password is incorrect.";
const RATE_LIMITED = "Too many attempts. Wait a few minutes and try again.";
const UNREACHABLE = "Couldn't reach the server. Try again.";

function failUrl(message: string) {
  return `/login?${new URLSearchParams({ error: message }).toString()}`;
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const response = await fetch(`${process.env.BACKEND_API_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ Email: email, Password: password }),
  }).catch(() => null);

  // Never reveal whether the email exists: every rejection gets the same message.
  if (!response) redirect(failUrl(UNREACHABLE));
  if (response.status === 429) redirect(failUrl(RATE_LIMITED));
  if (!response.ok) redirect(failUrl(GENERIC_ERROR));

  // The backend only returns a short-lived token here; the real session starts after the second factor.
  const challenge: TwoFactorChallenge = await response.json();
  await setTwoFactorCookie(challenge.twoFactorToken, challenge.setupRequired);

  redirect(`/login/two-factor/${challenge.setupRequired ? "setup" : "verify"}`);
}
