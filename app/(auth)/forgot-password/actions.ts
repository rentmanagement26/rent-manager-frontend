"use server";

import { redirect } from "next/navigation";
import { extractErrorMessage } from "@/lib/api-error";

export async function forgotPasswordAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");

  const response = await fetch(`${process.env.BACKEND_API_URL}/api/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ Email: email }),
  });

  if (!response.ok) {
    const message = await extractErrorMessage(response);
    redirect(`/forgot-password?error=${encodeURIComponent(message)}`);
  }

  redirect("/forgot-password?sent=1");
}