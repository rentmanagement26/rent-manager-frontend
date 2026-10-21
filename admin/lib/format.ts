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

// "$29" for whole prices, "$29.50" otherwise. The backend stores plain numbers with no currency, so only the sign is shown.
export function formatPrice(amount: number) {
  return Number.isInteger(amount) ? `$${amount}` : `$${amount.toFixed(2)}`;
}

// "Hardeep Singh" -> "HS". Used for avatar circles.
export function initials(fullName: string) {
  return fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

// "Oct 12, 2026" in the console's time zone, for dates that are not about "today" (notice sent, applies on, ...).
export function formatDate(value: string) {
  return parseUtc(value).toLocaleDateString("en-CA", { timeZone: TIME_ZONE, year: "numeric", month: "short", day: "numeric" });
}

// Tomorrow as "yyyy-mm-dd" (UTC), the earliest date a date picker may offer for a postponement.
export function tomorrowIso() {
  return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

// "1 property", "5 properties", "1 unit", "20 units": limit names come plural ("Properties", "Units"), so a value of 1 needs the singular.
export function limitText(value: number, displayName: string) {
  const name = displayName.toLowerCase();
  if (value !== 1) return `${value} ${name}`;
  if (name.endsWith("ies")) return `1 ${name.slice(0, -3)}y`;
  return name.endsWith("s") ? `1 ${name.slice(0, -1)}` : `1 ${name}`;
}
