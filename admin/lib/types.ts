export const ADMIN_ROLES = ["SuperAdmin", "Support", "Billing"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export function isAdminRole(role: string | undefined): role is AdminRole {
  return !!role && (ADMIN_ROLES as readonly string[]).includes(role);
}

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  role: AdminRole;
  backendToken?: string;
  backendTokenExpiresAt?: string;
  refreshToken?: string;
  refreshTokenExpiresAt?: string;
}

export interface BackendAuthResponse {
  token: string;
  expiresAt: string;
  userId: string;
  email: string;
  fullName: string;
  roles: string[];
  refreshToken: string;
  refreshTokenExpiresAt: string;
}

export interface TwoFactorChallenge {
  setupRequired: boolean;
  twoFactorToken: string;
}

export interface TwoFactorEnrollment {
  sharedKey: string;
  authenticatorUri: string;
}

export interface TwoFactorEnabledResult {
  auth: BackendAuthResponse;
  recoveryCodes: string[];
}

// Server actions return this (not a thrown error) so the client can narrow with `"error" in result`.
export interface ActionFailure {
  error: string;
  expired: boolean;
}
