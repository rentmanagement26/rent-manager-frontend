import { backendFetch } from "@/lib/api-client";
import { SessionExpiredError, extractErrorMessage } from "@/lib/api-error";
import type { BackendAuthResponse, UserProfile } from "@/lib/types";

async function profileRequest<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const response = await backendFetch(`/api/v1/auth/${path}`, token, init);
  // A wrong current password is a 400, so a 401 here really means the session is gone.
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

export function getMyProfile(token: string): Promise<UserProfile> {
  return profileRequest("profile", token);
}

export function updateMyProfile(
  token: string,
  input: { firstName: string; middleName: string; lastName: string }
): Promise<UserProfile> {
  return profileRequest("profile", token, {
    method: "PUT",
    body: JSON.stringify({
      FirstName: input.firstName,
      MiddleName: input.middleName || null,
      LastName: input.lastName,
    }),
  });
}

export function changeMyPassword(
  token: string,
  currentPassword: string,
  newPassword: string
): Promise<BackendAuthResponse> {
  return profileRequest("change-password", token, {
    method: "POST",
    body: JSON.stringify({ CurrentPassword: currentPassword, NewPassword: newPassword }),
  });
}
