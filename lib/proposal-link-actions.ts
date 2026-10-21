"use server";

// Server action behind the Accept / Decline buttons of the emailed-link page. It needs no session: the link's secret is the proof.
import { ProposalLinkError, answerByLink, looksLikeToken } from "@/lib/proposal-link-api";

export type LinkAnswer = { ok: true } | { error: string; code?: string };

export async function answerByLinkAction(token: string, accept: boolean): Promise<LinkAnswer> {
  if (!looksLikeToken(token)) return { error: "This link is no longer active.", code: "not_found" };

  try {
    await answerByLink(token, accept === true);
    return { ok: true };
  } catch (err) {
    if (err instanceof ProposalLinkError) return { error: err.message, code: err.code };
    return { error: "Couldn't save your answer. Please try again." };
  }
}
