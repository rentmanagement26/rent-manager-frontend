"use client";

// Keeps the page up to date while proposals wait for a customer's answer: it asks the server every few seconds
// (only while the tab is visible and something is waiting) and, when a landlord answers, shows a message and
// refreshes the page so the new plan appears. This is polling; true push needs a backend channel.
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { goToSessionExpired } from "@/components/console/ui";
import { loadAwaitingProposalsAction } from "@/lib/proposal-actions";
import { loadLandlordSubscriptionAction } from "@/lib/subscription-actions";
import type { AwaitingProposal } from "@/lib/types";

const POLL_MS = 10_000;

interface Props {
  // Proposals waiting right now, as the server rendered them.
  awaiting: AwaitingProposal[];
  // Limits the check to one landlord (the detail page). Leave out for the whole list.
  search?: string;
}

export function ProposalWatcher({ awaiting, search }: Props) {
  const router = useRouter();
  const [messages, setMessages] = useState<string[]>([]);
  // What the server last told us was waiting, so we can see which proposals disappeared.
  const known = useRef<AwaitingProposal[]>(awaiting);

  // After the server re-renders with fresh data, remember it.
  useEffect(() => {
    known.current = awaiting;
  }, [awaiting]);

  useEffect(() => {
    if (awaiting.length === 0) return;

    async function check() {
      if (document.visibilityState !== "visible") return;

      const result = await loadAwaitingProposalsAction(search);
      if ("error" in result) {
        if (result.expired) goToSessionExpired();
        return;
      }

      const stillWaiting = new Set(result.data.map((p) => p.changeId));
      const answered = known.current.filter((p) => !stillWaiting.has(p.changeId));
      if (answered.length === 0) return;
      known.current = result.data;

      // A proposal leaves the waiting list when approved, declined or withdrawn; the landlord's plan tells which.
      const lines = await Promise.all(
        answered.map(async (p) => {
          const sub = await loadLandlordSubscriptionAction(p.landlordProfileId);
          const plan = "data" in sub ? (sub.data.subscription.packageName ?? "no plan") : null;
          return plan ? `${p.landlordName} answered the proposal. Their plan is now ${plan}.` : `${p.landlordName} answered the proposal.`;
        }),
      );
      setMessages((current) => [...current, ...lines]);
      router.refresh();
    }

    const timer = setInterval(check, POLL_MS);
    return () => clearInterval(timer);
  }, [awaiting.length, search, router]);

  if (messages.length === 0) return null;

  return (
    <div role="status" className="fixed bottom-4 right-4 z-40 flex max-w-sm flex-col gap-2">
      {messages.map((text, index) => (
        <div key={index} className="flex items-start gap-3 rounded-2xl border border-c-bd bg-c-sf p-4 text-[13px] shadow-c-card">
          <span className="flex-1">{text}</span>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => setMessages((current) => current.filter((_, i) => i !== index))}
            className="text-c-tx2 hover:text-c-tx"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
