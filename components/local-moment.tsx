"use client";

// Shows a moment in time (for example "Nov 3, 9:10 a.m.") in the viewer's own time zone. The server does not know that zone, so it draws the page
// in UTC and the browser replaces the text with the local time as soon as the page loads (useSyncExternalStore does the swap safely).
import { useSyncExternalStore } from "react";
import { formatMoment } from "@/lib/maintenance-format";

// Nothing ever changes the time zone while the page is open, so there is nothing to subscribe to.
const subscribe = () => () => {};

export function LocalMoment({ iso }: { iso: string }) {
  const text = useSyncExternalStore(
    subscribe,
    () => formatMoment(iso),
    () => formatMoment(iso, "UTC"),
  );
  return <time dateTime={iso}>{text}</time>;
}
