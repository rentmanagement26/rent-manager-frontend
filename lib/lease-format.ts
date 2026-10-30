// Words and numbers for lease details: turns the backend's enum names into plain text and formats money and days.

export const UTILITIES = ["Heat", "Water", "Electricity", "Gas", "Internet"] as const;

export const RESPONSIBILITY_OPTIONS = [
  { value: "not_applicable", label: "Not applicable" },
  { value: "included_in_rent", label: "Included in rent" },
  { value: "landlord_pays", label: "Landlord pays" },
  { value: "tenant_pays", label: "Tenant pays" },
] as const;

export const CHARGE_TYPES = [
  { value: "parking", label: "Parking" },
  { value: "storage", label: "Storage" },
  { value: "other", label: "Other" },
] as const;

export const CHARGE_FREQUENCIES = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
] as const;

// "TenantPays" -> "tenant_pays": the backend answers with enum names but takes underscored words.
export function toWire(value: string): string {
  return value.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase();
}

// Finds the plain label for a backend word, or falls back to the word itself.
export function labelFor(value: string, options: readonly { value: string; label: string }[]): string {
  return options.find((option) => option.value === toWire(value))?.label ?? value;
}

export function formatMoney(amount: number | null): string {
  if (amount === null) return "Not set";
  return amount.toLocaleString("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 2 });
}

// 1 -> "1st", 22 -> "22nd".
export function ordinal(day: number): string {
  const rest = day % 100;
  if (rest >= 11 && rest <= 13) return `${day}th`;
  return `${day}${["th", "st", "nd", "rd"][day % 10] ?? "th"}`;
}

// A charge's amount as a monthly figure: a quarterly charge counts a third, a yearly charge a twelfth.
export function monthlyEquivalent(amount: number, frequency: string): number {
  const wire = toWire(frequency);
  return wire === "quarterly" ? amount / 3 : wire === "yearly" ? amount / 12 : amount;
}

// Rent plus every extra charge, per month. Null when there is neither a rent nor a charge to add up.
export function monthlyTotal(rent: number | null, charges: { amount: number; frequency: string }[]): number | null {
  if (rent === null && charges.length === 0) return null;
  const extra = charges.reduce((sum, charge) => sum + monthlyEquivalent(charge.amount, charge.frequency), 0);
  return Math.round(((rent ?? 0) + extra) * 100) / 100;
}
