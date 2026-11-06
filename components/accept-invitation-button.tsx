"use client";

// The "Accept the invitation" button on the contractor invitation page. It links the signed-in contractor's account to the entry on the
// landlord's list, then opens their jobs. Any email link the landlord sent them stops working.
import { useRouter } from "next/navigation";
import { useState } from "react";
import { acceptInvitationAction } from "@/lib/contractor-portal-actions";
import { goToSessionExpired } from "@/lib/session-expired-client";

export function AcceptInvitationButton({ inviteToken, landlordName }: { inviteToken: string; landlordName: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function accept() {
    setBusy(true);
    setError("");
    const result = await acceptInvitationAction(inviteToken);
    if ("ok" in result) {
      router.push("/contractor/jobs");
      return;
    }
    setBusy(false);
    if (result.expired) goToSessionExpired();
    else setError(result.error);
  }

  return (
    <div>
      <button type="button" disabled={busy} onClick={accept} className="w-full rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-50">
        {busy ? "Accepting…" : "Accept the invitation"}
      </button>
      <p className="mt-2 text-xs text-muted">Accepting links your account to {landlordName}&apos;s list. Any email link they sent you stops working, and your jobs appear in your account.</p>
      {error && <p role="alert" className="mt-3 text-sm font-medium text-red-700">{error}</p>}
    </div>
  );
}
