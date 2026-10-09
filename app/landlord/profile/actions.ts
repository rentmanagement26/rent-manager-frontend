"use server";

import { extractErrorMessage } from "@/lib/api-error";
import { requireBackendToken } from "@/lib/auth-guard";
import type { ActionFailure } from "@/lib/types";

// Always uses the signed-in user's own email, never a value from the client.
export async function sendPasswordResetLinkAction(): Promise<{ message: string } | ActionFailure> {
  const session = await requireBackendToken(["Admin", "Landlord"]);

  const response = await fetch(`${process.env.BACKEND_API_URL}/api/v1/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ Email: session.email }),
  });

  if (!response.ok) {
    return { error: await extractErrorMessage(response), expired: false };
  }

  return { message: `We sent a reset link to ${session.email}.` };
}
