"use server";

import { redirect } from "next/navigation";
import { extractErrorMessage } from "@/lib/api-error";

export async function resetPasswordAction(formData: FormData) {
  const userId = String(formData.get("userId") ?? "");
  const token = String(formData.get("token") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");

  const response = await fetch(`${process.env.BACKEND_API_URL}/api/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ UserId: userId, Token: token, NewPassword: newPassword }),
  });

  if (!response.ok) {
    const message = await extractErrorMessage(response);
    redirect(
      `/reset-password?userId=${encodeURIComponent(userId)}&token=${encodeURIComponent(token)}&error=${encodeURIComponent(message)}`
    );
  }

  redirect("/login?reset=1");
}