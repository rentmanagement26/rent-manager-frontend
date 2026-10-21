// Backend calls for the Accept / Decline buttons in a plan proposal email. The landlord does not sign in: the secret
// in the link is the proof. Reading (GET) changes nothing; only the POST answers.
import type { PendingPlanChange, PlanSnapshot } from "@/lib/types";

const BASE = "/api/v1/proposal-links";

// The same shape the backend uses for a signed-in proposal, but only while the link is open.
export interface ProposalLinkView {
  state: "open" | "answered" | "expired";
  message: string | null;
  expiresAt: string | null;
  current: PlanSnapshot | null;
  target: PlanSnapshot | null;
  changes: PendingPlanChange["changes"] | null;
}

export type ProposalLinkResult =
  | { status: "ok"; data: ProposalLinkView }
  | { status: "invalid" } // the link matches nothing
  | { status: "error" }; // the backend could not be reached

// Same check as the backend: letters, digits, dash and underscore only, so odd input never reaches it.
export function looksLikeToken(token: string | undefined): token is string {
  return !!token && token.length <= 100 && /^[A-Za-z0-9_-]+$/.test(token);
}

// What the confirm page shows. Never throws.
export async function getProposalByLink(token: string): Promise<ProposalLinkResult> {
  try {
    const response = await fetch(`${process.env.BACKEND_API_URL}${BASE}/${token}`, { cache: "no-store" });
    if (response.status === 404) return { status: "invalid" };
    if (!response.ok) return { status: "error" };
    return { status: "ok", data: (await response.json()) as ProposalLinkView };
  } catch {
    return { status: "error" };
  }
}

// How an answer can fail. `code` is the backend's stable code ("not_open", "expired", "over_limits", ...).
export class ProposalLinkError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
  ) {
    super(message);
  }
}

// Accepts or declines. Accepting changes the plan right away, with the same checks as any plan change.
export async function answerByLink(token: string, accept: boolean): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${process.env.BACKEND_API_URL}${BASE}/${token}/${accept ? "accept" : "decline"}`, { method: "POST" });
  } catch {
    throw new ProposalLinkError("We couldn't reach DomusPRO. Please try again.");
  }
  if (response.ok) return;
  if (response.status === 429) throw new ProposalLinkError("Too many attempts. Wait a minute and try again.", "rate_limited");

  // The backend's errors look like { code, message }.
  let body: { code?: string; message?: string } | null = null;
  try {
    body = await response.json();
  } catch {
    // Not JSON; the generic message below is used.
  }
  throw new ProposalLinkError(body?.message ?? "Couldn't save your answer. Please try again.", body?.code);
}
