"use server";

import { redirect } from "next/navigation";
import { resetPassword } from "@/lib/password-api";

// Runs when the "Set new password" form is submitted.
export async function resetPasswordAction(formData: FormData) {
  // userId and token come from the emailed link; the page passes them along as hidden fields.
  const userId = String(formData.get("userId") ?? "");
  const token = String(formData.get("token") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  // Sends the person back to the form (keeping the link's values) with a message.
  const back = (error: string) =>
    redirect(`/login/reset-password?${new URLSearchParams({ userId, token, error })}`);

  if (!userId || !token) back("This reset link is not valid. Ask for a new one.");
  if (newPassword !== confirm) back("The two passwords don't match.");

  let error = "";
  try {
    await resetPassword(userId, token, newPassword);
  } catch (err) {
    error = err instanceof Error ? err.message : "Couldn't reset the password. Try again.";
  }

  // redirect() must stay outside try/catch (it works by throwing).
  if (error) back(error);

  redirect("/login/reset-password?done=1");
}
