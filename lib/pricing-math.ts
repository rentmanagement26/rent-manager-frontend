// The yearly numbers shown on plan cards: what a yearly plan costs per month, and what it saves against twelve monthly payments.

const cents = (value: number) => Math.round(value * 100) / 100;

// "$18.33": the yearly price spread over twelve months.
export function yearlyPerMonth(yearly: number): number {
  return cents(yearly / 12);
}

// Twelve monthly payments minus the yearly price; never negative.
export function yearlySaving(monthly: number, yearly: number): number {
  return Math.max(0, cents(monthly * 12 - yearly));
}
