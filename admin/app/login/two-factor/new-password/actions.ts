"use server";

import { redirect } from "next/navigation";
import { SESSION_EXPIRED_MESSAGE, clearTwoFactorCookie, getTwoFactorToken, isSessionExpiredMessage, setTwoFactorCookie } from "@/lib/auth-session";
import { completePasswordChange } from "@/lib/password-api";
import type { TwoFactorChallenge } from "@/lib/types";

// Runs when the first-sign-in "choose your password" form is submitted.
export async function newPasswordAction(formData: FormData) {
  // The short-lived token from the sign-in step, kept in a cookie.
  const token = await getTwoFactorToken();
  if (!token) redirect(`/login?${new URLSearchParams({ error: SESSION_EXPIRED_MESSAGE })}`);

  const newPassword = String(formData.get("newPassword") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");
  if (newPassword !== confirm) {
    redirect(`/login/two-factor/new-password?${new URLSearchParams({ error: "The two passwords don't match." })}`);
  }

  let next: TwoFactorChallenge | undefined;
  let error = "";
  try {
    next = await completePasswordChange(token, newPassword);
  } catch (err) {
    error = err instanceof Error ? err.message : "Couldn't set the password. Try again.";
  }

  // redirect() must stay outside try/catch (it works by throwing).
  if (!next) {
    // The step timed out: start over from sign-in. Anything else (for example a weak password): stay and retry.
    if (isSessionExpiredMessage(error)) {
      await clearTwoFactorCookie();
      redirect(`/login?${new URLSearchParams({ error })}`);
    }
    redirect(`/login/two-factor/new-password?${new URLSearchParams({ error })}`);
  }

  // Password is set. Carry on with the normal next step: set up 2FA the first time, otherwise enter the code.
  await setTwoFactorCookie(next.twoFactorToken, next.setupRequired);
  redirect(`/login/two-factor/${next.setupRequired ? "setup" : "verify"}`);
}
