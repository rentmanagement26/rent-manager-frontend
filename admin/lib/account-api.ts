import { backendFetch } from "@/lib/api-client";
import { SessionExpiredError, extractErrorMessage } from "@/lib/api-error";
import type { BackendAuthResponse } from "@/lib/types";

// A wrong current password is a 400, so a 401 here really means the session is gone.
export async function changeMyPassword(
  token: string,
  currentPassword: string,
  newPassword: string,
): Promise<BackendAuthResponse> {
  const response = await backendFetch("/api/v1/auth/change-password", token, {
    method: "POST",
    body: JSON.stringify({ CurrentPassword: currentPassword, NewPassword: newPassword }),
  });
  if (response.status === 401) {
    throw new SessionExpiredError();
  }
  if (response.status === 429) {
    throw new Error("Too many attempts. Wait a minute and try again.");
  }
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }
  return response.json();
}
