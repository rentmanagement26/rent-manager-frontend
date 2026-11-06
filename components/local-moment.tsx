"use client";

// Shows a moment in time (for example "Nov 3, 9:10 a.m.") in the viewer's own time zone. The server would use its own zone, so the text is
// worked out in the browser; the small mismatch on first paint is expected and silenced.
import { formatMoment } from "@/lib/maintenance-format";

export function LocalMoment({ iso }: { iso: string }) {
  return (
    <time dateTime={iso} suppressHydrationWarning>
      {formatMoment(iso)}
    </time>
  );
}
