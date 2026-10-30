// The lease terms saved with a lease document when it was sent (the backend's "termsSnapshot", a JSON text), and a comparison with the
// lease's live terms, so the landlord can see when the terms were changed after the lease was sent.
import { CHARGE_FREQUENCIES, CHARGE_TYPES, RESPONSIBILITY_OPTIONS, UTILITIES, formatMoney, labelFor, ordinal, toWire } from "@/lib/lease-format";
import type { TenancyDetails } from "@/lib/tenancy-types";

// The terms as they were when the lease was sent. Same shape as the live terms, without the tenants.
export interface SnapshotTerms {
  takenAt: string | null;
  monthlyRent: number | null;
  termType: string;
  startDate: string | null;
  endDate: string | null;
  rentDueDay: number | null;
  securityDeposit: number | null;
  petDeposit: number | null;
  utilities: { utility: string; responsibility: string }[];
  charges: { type: string; description: string; amount: number; frequency: string }[];
}

// Reads a value by name whatever its capitalisation (the backend writes the snapshot with its own property names).
function pick(source: Record<string, unknown>, name: string): unknown {
  const key = Object.keys(source).find((k) => k.toLowerCase() === name.toLowerCase());
  return key ? source[key] : undefined;
}

const asNumber = (value: unknown): number | null => (typeof value === "number" ? value : null);
const asText = (value: unknown): string | null => (typeof value === "string" ? value : null);
const asList = (value: unknown): Record<string, unknown>[] => (Array.isArray(value) ? (value as Record<string, unknown>[]) : []);

// Null when the document has no snapshot yet (a lease that was never sent) or it can't be read.
export function parseSnapshot(json: string | null): SnapshotTerms | null {
  if (!json) return null;
  try {
    const raw = JSON.parse(json) as Record<string, unknown>;
    return {
      takenAt: asText(pick(raw, "takenAt")),
      monthlyRent: asNumber(pick(raw, "monthlyRent")),
      termType: asText(pick(raw, "termType")) ?? "",
      startDate: asText(pick(raw, "startDate")),
      endDate: asText(pick(raw, "endDate")),
      rentDueDay: asNumber(pick(raw, "rentDueDay")),
      securityDeposit: asNumber(pick(raw, "securityDeposit")),
      petDeposit: asNumber(pick(raw, "petDeposit")),
      utilities: asList(pick(raw, "utilities")).map((u) => ({ utility: asText(pick(u, "utility")) ?? "", responsibility: asText(pick(u, "responsibility")) ?? "" })),
      charges: asList(pick(raw, "charges")).map((c) => ({
        type: asText(pick(c, "type")) ?? "",
        description: asText(pick(c, "description")) ?? "",
        amount: asNumber(pick(c, "amount")) ?? 0,
        frequency: asText(pick(c, "frequency")) ?? "",
      })),
    };
  }
  catch {
    return null;
  }
}

const day = (value: string | null) => (value ? value.slice(0, 10) : "none");
const termWord = (value: string) => (toWire(value) === "fixed" ? "Fixed term" : "Month to month");

// One line per charge, so two lists can be compared as text.
function chargeLines(charges: SnapshotTerms["charges"]): string[] {
  return charges.map((c) => `${labelFor(c.type, CHARGE_TYPES)} ${c.description} ${formatMoney(c.amount)} ${labelFor(c.frequency, CHARGE_FREQUENCIES).toLowerCase()}`.replace(/\s+/g, " ").trim());
}

// What is different between the terms the lease was sent with and the lease's terms now. Empty when they match.
export function diffTerms(sent: SnapshotTerms, live: TenancyDetails): string[] {
  const changes: string[] = [];
  const add = (label: string, before: string, after: string) => {
    if (before !== after) changes.push(`${label}: was ${before}, now ${after}`);
  };

  add("Monthly rent", formatMoney(sent.monthlyRent), formatMoney(live.monthlyRent));
  add("Term", termWord(sent.termType), termWord(live.termType));
  add("Start date", day(sent.startDate), day(live.startDate));
  add("End date", day(sent.endDate), day(live.endDate));
  add("Rent due day", sent.rentDueDay ? ordinal(sent.rentDueDay) : "not set", live.rentDueDay ? ordinal(live.rentDueDay) : "not set");
  add("Security deposit", formatMoney(sent.securityDeposit), formatMoney(live.securityDeposit));
  add("Pet deposit", formatMoney(sent.petDeposit), formatMoney(live.petDeposit));

  for (const name of UTILITIES) {
    const find = (list: { utility: string; responsibility: string }[]) => labelFor(list.find((u) => toWire(u.utility) === name.toLowerCase())?.responsibility ?? "not_applicable", RESPONSIBILITY_OPTIONS);
    add(name, find(sent.utilities), find(live.utilities));
  }

  const before = chargeLines(sent.charges).join("; ") || "none";
  const after = chargeLines(live.charges).join("; ") || "none";
  add("Extra charges", before, after);
  return changes;
}

// The snapshot dressed as lease details (with the live lease's id, status and tenants), so the same terms cards can show it.
export function snapshotAsDetails(sent: SnapshotTerms, live: TenancyDetails): TenancyDetails {
  return {
    ...live,
    monthlyRent: sent.monthlyRent,
    termType: toWire(sent.termType) === "fixed" ? "Fixed" : "MonthToMonth",
    startDate: sent.startDate ?? live.startDate,
    endDate: sent.endDate,
    rentDueDay: sent.rentDueDay,
    securityDeposit: sent.securityDeposit,
    petDeposit: sent.petDeposit,
    utilities: sent.utilities,
    charges: sent.charges.map((charge, index) => ({ id: index, type: charge.type, description: charge.description, amount: charge.amount, frequency: charge.frequency, startsOn: null, endsOn: null })),
  };
}
