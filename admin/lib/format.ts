// The backend sends UTC timestamps, sometimes without a trailing Z. Treat them as UTC either way.
function parseUtc(value: string) {
  return new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(value) ? value : `${value}Z`);
}

const TIME_ZONE = "America/Toronto";

export function formatWhen(value: string, now = new Date()) {
  const date = parseUtc(value);
  const sameDay = (a: Date, b: Date) =>
    a.toLocaleDateString("en-CA", { timeZone: TIME_ZONE }) === b.toLocaleDateString("en-CA", { timeZone: TIME_ZONE });

  if (sameDay(date, now)) {
    return date.toLocaleTimeString("en-CA", { timeZone: TIME_ZONE, hour: "2-digit", minute: "2-digit", hour12: false });
  }
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  if (sameDay(date, yesterday)) return "Yesterday";
  return date.toLocaleDateString("en-CA", { timeZone: TIME_ZONE, month: "short", day: "numeric" });
}

export function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}
