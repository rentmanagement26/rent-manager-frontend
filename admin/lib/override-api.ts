// Calls for one landlord's overrides: extra limit allowances and feature grants/removals on top of their plan.
import { getJson } from "@/lib/api-client";
import { send } from "@/lib/staff-api";
import type { LandlordOverride } from "@/lib/types";

const BASE = "/api/v1/admin/landlords";

// Every override for the landlord, newest first, including expired and revoked ones.
export async function getOverrides(token: string, landlordProfileId: number) {
  const result = await getJson<{ items: LandlordOverride[] }>(
    `${BASE}/${landlordProfileId}/overrides?includeInactive=true`,
    token,
  );
  return result.status === "ok" ? { status: "ok" as const, data: result.data.items } : result;
}

interface Reason {
  reasonCode: string;
  note: string;
  expiresAt: string | null; // ISO date-time in UTC, or null for no end date
}

// Gives the landlord `additionalValue` more of a limit (for example +2 properties).
export function grantLimitOverride(token: string, landlordProfileId: number, input: Reason & { limitKey: string; additionalValue: number }) {
  return send<{ id: number }>("POST", `${BASE}/${landlordProfileId}/overrides/limits`, token, {
    LimitKey: input.limitKey,
    AdditionalValue: input.additionalValue,
    ExpiresAt: input.expiresAt,
    ReasonCode: input.reasonCode,
    Note: input.note,
  });
}

// Switches a feature on (grant) or off (remove) for the landlord, whatever their plan says.
export function grantFeatureOverride(token: string, landlordProfileId: number, input: Reason & { featureKey: string; grant: boolean }) {
  return send<{ id: number }>("POST", `${BASE}/${landlordProfileId}/overrides/features`, token, {
    FeatureKey: input.featureKey,
    Grant: input.grant,
    ExpiresAt: input.expiresAt,
    ReasonCode: input.reasonCode,
    Note: input.note,
  });
}

// Ends an override early. The note is required.
export function revokeOverride(token: string, landlordProfileId: number, kind: "limit" | "feature", overrideId: number, note: string) {
  return send<null>("POST", `${BASE}/${landlordProfileId}/overrides/${kind === "limit" ? "limits" : "features"}/${overrideId}/revoke`, token, {
    Note: note,
  });
}
