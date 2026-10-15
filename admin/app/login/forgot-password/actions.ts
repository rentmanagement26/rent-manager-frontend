"use server";

import { redirect } from "next/navigation";
import { requestPasswordReset } from "@/lib/password-api";

// Runs when the "Send reset link" form is submitted.
export async function forgotPasswordAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();

  let error = "";
  try {
    await requestPasswordReset(email);
  } catch (err) {
    error = err instanceof Error ? err.message : "Couldn't send the link. Try again.";
  }

  // redirect() must stay outside try/catch (it works by throwing).
  if (error) redirect(`/login/forgot-password?${new URLSearchParams({ error })}`);

  // Same screen whether or not the account exists, so this form can't be used to find out who has an account.
  redirect("/login/forgot-password?sent=1");
}
