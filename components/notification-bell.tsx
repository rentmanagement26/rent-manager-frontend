"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { markNotificationReadAction } from "@/app/landlord/notifications/actions";
import { formatRelativeTime } from "@/lib/format-time";
import {
  adjustUnreadCount,
  getUnreadCountSnapshot,
  refreshUnreadCount,
  subscribeToUnreadCount,
} from "@/lib/notification-store";
import type { NotificationItem } from "@/lib/types";

const DROPDOWN_LIMIT = 6;

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const count = useSyncExternalStore(subscribeToUnreadCount, getUnreadCountSnapshot, () => 0);
  const [items, setItems] = useState<NotificationItem[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const loadItems = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications", { cache: "no-store" });
      if (!response.ok) throw new Error("Request failed");
      const list: NotificationItem[] = await response.json();
      setItems(list.slice(0, DROPDOWN_LIMIT));
      setLoadFailed(false);
    } catch {
      setLoadFailed(true);
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleToggle() {
    const next = !open;
    setOpen(next);
    if (next) loadItems();
  }

  async function handleItemClick(item: NotificationItem) {
    if (item.isRead) return;

    setItems((current) => current?.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)) ?? null);
    adjustUnreadCount(-1);

    const result = await markNotificationReadAction(item.id);
    if ("error" in result) {
      loadItems();
    }
    refreshUnreadCount();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={handleToggle}
        className="relative w-10 h-10 rounded-full bg-white text-heading flex items-center justify-center hover:bg-subtle transition"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-accent px-1 text-[11px] font-semibold leading-[18px] text-white text-center">
            {count > 9 ? "9+" : count}
            <span className="sr-only"> unread</span>
          </span>
        )}
      </button>

      {open && (
        <div className="max-sm:fixed max-sm:inset-x-4 max-sm:top-16 sm:absolute sm:right-0 sm:mt-2 sm:w-80 rounded-xl border border-slate-200 bg-white shadow-lg z-40 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">Notifications</p>
            <Link
              href="/landlord/notifications"
              onClick={() => setOpen(false)}
              className="text-xs font-semibold text-accent hover:text-accent-dark"
            >
              View all
            </Link>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loadFailed && <p className="px-4 py-6 text-center text-sm text-muted">Couldn&apos;t load notifications.</p>}
            {!loadFailed && items === null && <p className="px-4 py-6 text-center text-sm text-muted">Loading…</p>}
            {!loadFailed && items?.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-muted">You&apos;re all caught up.</p>
            )}
            {!loadFailed &&
              items?.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleItemClick(item)}
                  className="flex w-full gap-3 border-t border-slate-100 px-4 py-3 text-left first:border-t-0 hover:bg-slate-50"
                >
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.isRead ? "bg-transparent" : "bg-accent"}`}
                    aria-hidden="true"
                  />
                  <span className="min-w-0">
                    <span className={`block text-sm text-heading ${item.isRead ? "" : "font-semibold"}`}>
                      {item.title}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted">{item.body}</span>
                    <time dateTime={item.createdAt} suppressHydrationWarning className="mt-1 block text-[11px] text-muted">
                      {formatRelativeTime(item.createdAt)}
                    </time>
                  </span>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
