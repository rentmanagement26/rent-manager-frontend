import { extractErrorMessage } from "@/lib/api-error";
import type { TwoFactorChallenge } from "@/lib/types";

// Password calls for the ADMIN (staff) sign-in. These are public calls (the person is not signed in yet),
// so there is no session token. The backend has two "doors": customers use /api/v1/auth, staff use
// /api/v1/admin/auth. Staff accounts are refused at the customer door, so this app only uses the staff door.

async function post(path: string, body: Record<string, string>): Promise<Response> {
  return fetch(`${process.env.BACKEND_API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// Step 1 of "forgot password": asks the backend to email a reset link to this staff address.
// The backend always answers OK, whether or not the account exists, so nobody can probe for accounts.
export async function requestPasswordReset(email: string): Promise<void> {
  const response = await post("/api/v1/admin/auth/forgot-password", {
    Email: email,
  });
  if (response.status === 429) throw new Error("Too many attempts. Wait a few minutes and try again.");
  if (!response.ok) throw new Error(await extractErrorMessage(response));
}

// Step 2: the person opened the emailed link (which carries userId + token) and chose a new password.
// Throws with the backend's message when the link is old/used or the password is too weak.
export async function resetPassword(userId: string, token: string, newPassword: string): Promise<void> {
  const response = await post("/api/v1/auth/reset-password", {
    UserId: userId,
    Token: token,
    NewPassword: newPassword,
  });
  if (response.status === 429) throw new Error("Too many attempts. Wait a few minutes and try again.");
  if (!response.ok) throw new Error(await extractErrorMessage(response));
}

// A new staff account (or a freshly bootstrapped SuperAdmin) signs in once with a temporary password and
// must then choose a real one. `twoFactorToken` is the short-lived token the login call returned for this step.
// On success the backend answers with the next sign-in step (2FA setup or the 2FA code check).
export async function completePasswordChange(twoFactorToken: string, newPassword: string): Promise<TwoFactorChallenge> {
  const response = await post("/api/v1/admin/auth/complete-password-change", {
    TwoFactorToken: twoFactorToken,
    NewPassword: newPassword,
  });
  if (response.status === 401) throw new Error("This step has expired. Please sign in again.");
  if (response.status === 429) throw new Error("Too many attempts. Wait a few minutes and try again.");
  if (!response.ok) throw new Error(await extractErrorMessage(response));
  return response.json();
}
