"use server";

import { requireAdmin } from "@/lib/auth-guard";
import { getLandlordSubscription } from "@/lib/subscription-api";
import type { ActionFailure, AdminLandlordSubscription } from "@/lib/types";

// Server actions can be called by anyone holding a session cookie, so each one re-checks its input and the role.
// The backend enforces permissions too; these checks mainly give friendlier messages.

// Loads one landlord's plan and usage when the "Propose plan" popup opens.
export async function loadLandlordSubscriptionAction(
  landlordProfileId: number,
): Promise<{ ok: true; data: AdminLandlordSubscription } | ActionFailure> {
  const session = await requireAdmin();

  const result = await getLandlordSubscription(session.backendToken, Number(landlordProfileId));
  if (result.status === "ok") return { ok: true, data: result.data };
  if (result.status === "expired") return { error: "Your session expired. Sign in again.", expired: true };
  if (result.status === "forbidden") return { error: "Your role can't view this landlord's plan.", expired: false };
  return { error: "Couldn't load this landlord's plan. Try again.", expired: false };
}
