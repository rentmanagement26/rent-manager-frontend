"use server";

import { SessionExpiredError, extractErrorMessage } from "@/lib/api-error";
import { requireBackendToken } from "@/lib/auth-guard";
import { saveSession, updateSessionFullName } from "@/lib/auth-session";
import { changeMyPassword, updateMyProfile } from "@/lib/profile-api";
import type { ActionFailure, UserProfile } from "@/lib/types";

function failure(err: unknown, fallback: string): ActionFailure {
  if (err instanceof SessionExpiredError) {
    return { error: err.message, expired: true };
  }
  return { error: err instanceof Error ? err.message : fallback, expired: false };
}

export async function updateProfileAction(
  firstName: string,
  middleName: string,
  lastName: string
): Promise<{ profile: UserProfile } | ActionFailure> {
  const session = await requireBackendToken();

  try {
    const profile = await updateMyProfile(session.backendToken, {
      firstName: String(firstName).trim(),
      middleName: String(middleName).trim(),
      lastName: String(lastName).trim(),
    });
    await updateSessionFullName(profile.fullName);
    return { profile };
  } catch (err) {
    return failure(err, "Couldn't save your name. Please try again.");
  }
}

export async function changePasswordAction(
  currentPassword: string,
  newPassword: string
): Promise<{ ok: true } | ActionFailure> {
  const session = await requireBackendToken();

  try {
    const auth = await changeMyPassword(session.backendToken, String(currentPassword), String(newPassword));
    // The backend signed out every other device and issued a fresh session; keep this browser signed in.
    await saveSession(auth);
    return { ok: true };
  } catch (err) {
    return failure(err, "Couldn't change your password. Please try again.");
  }
}

// Always uses the signed-in user's own email, never a value from the client.
export async function sendPasswordResetLinkAction(): Promise<{ message: string } | ActionFailure> {
  const session = await requireBackendToken();

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
