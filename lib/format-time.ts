// For date-only values such as a tenancy start date: read in UTC so the day never shifts with the viewer's time zone.
export function formatCalendarDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });
}

export function formatRelativeTime(iso: string, now: number = Date.now()): string {
  const then = new Date(iso);
  const minutes = Math.floor((now - then.getTime()) / 60_000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

  const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const daysAgo = Math.round((startOfDay(new Date(now)) - startOfDay(then)) / 86_400_000);
  if (daysAgo === 1) return "Yesterday";

  return then.toLocaleDateString("en-CA", { month: "short", day: "numeric" });
}
