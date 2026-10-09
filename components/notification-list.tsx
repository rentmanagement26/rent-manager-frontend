"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatRelativeTime } from "@/lib/format-time";
import { refreshUnreadCount } from "@/lib/notification-store";
import type { NotificationItem } from "@/lib/types";
import { markNotificationReadAction } from "@/lib/notification-actions";

export function NotificationList({ items, emptyMessage }: { items: NotificationItem[]; emptyMessage: string }) {
  const router = useRouter();
  const [readIds, setReadIds] = useState<Set<number>>(new Set());

  async function handleClick(item: NotificationItem) {
    if (item.isRead || readIds.has(item.id)) return;

    setReadIds((current) => new Set(current).add(item.id));
    const result = await markNotificationReadAction(item.id);
    if ("error" in result) {
      setReadIds((current) => {
        const next = new Set(current);
        next.delete(item.id);
        return next;
      });
      return;
    }
    refreshUnreadCount();
    router.refresh();
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl rounded-2xl border border-default bg-white p-8 text-center text-sm text-muted shadow-sm">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="max-w-2xl divide-y divide-default overflow-hidden rounded-2xl border border-default bg-white shadow-sm">
      {items.map((item) => {
        const unread = !item.isRead && !readIds.has(item.id);
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => handleClick(item)}
            className={`block w-full px-5 py-4 text-left hover:bg-subtle ${
              unread ? "border-l-4 border-accent" : "border-l-4 border-transparent"
            }`}
          >
            <p className={`text-sm text-heading ${unread ? "font-semibold" : ""}`}>{item.title}</p>
            <p className="mt-0.5 text-sm text-muted">{item.body}</p>
            <time dateTime={item.createdAt} suppressHydrationWarning className="mt-1.5 block text-xs text-muted">
              {formatRelativeTime(item.createdAt)}
            </time>
          </button>
        );
      })}
    </div>
  );
}
