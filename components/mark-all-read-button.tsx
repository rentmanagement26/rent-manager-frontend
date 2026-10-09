"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { markAllNotificationsReadAction } from "@/lib/notification-actions";
import { clearUnreadCount, refreshUnreadCount } from "@/lib/notification-store";
import { goToSessionExpired } from "@/lib/session-expired-client";

export function MarkAllReadButton() {
  const router = useRouter();
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  async function handleClick() {
    setWorking(true);
    setError("");
    const result = await markAllNotificationsReadAction();
    setWorking(false);

    if ("error" in result) {
      if (result.expired) {
        goToSessionExpired();
      } else {
        setError(result.error);
      }
      return;
    }

    clearUnreadCount();
    refreshUnreadCount();
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3">
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button
        type="button"
        onClick={handleClick}
        disabled={working}
        className="text-sm font-semibold text-accent hover:text-accent-dark disabled:opacity-60"
      >
        {working ? "Marking…" : "Mark all as read"}
      </button>
    </div>
  );
}
