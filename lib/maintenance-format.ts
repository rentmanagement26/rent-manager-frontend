// The words and small helpers the maintenance screens share: the fixed lists (the value the backend wants and the label people read),
// the status pill, and the one-line summaries.
import { formatCalendarDate } from "@/lib/format-time";
import type { Urgency } from "@/lib/landlord-maintenance-types";
import type { AccessDetails, AccessInput, RequestListItem, RequestStatus, TenantVisit } from "@/lib/maintenance-types";

export interface Option {
  value: string;
  label: string;
}

export const CATEGORIES: Option[] = [
  { value: "Plumbing", label: "Plumbing" },
  { value: "Electrical", label: "Electrical" },
  { value: "Heating", label: "Heating" },
  { value: "Appliance", label: "Appliance" },
  { value: "Structural", label: "Structural" },
  { value: "Pests", label: "Pests" },
  { value: "Locks", label: "Locks" },
  { value: "Other", label: "Other" },
];

export const LOCATIONS: Option[] = [
  { value: "Kitchen", label: "Kitchen" },
  { value: "Bathroom", label: "Bathroom" },
  { value: "Bedroom", label: "Bedroom" },
  { value: "LivingRoom", label: "Living room" },
  { value: "LaundryOrBasement", label: "Laundry or basement" },
  { value: "EntryOrHallway", label: "Entry or hallway" },
  { value: "WholeUnit", label: "Whole unit" },
  { value: "CommonArea", label: "Common area" },
];

// Only asked when the place is "Common area".
export const COMMON_AREAS: Option[] = [
  { value: "Hallway", label: "Hallway" },
  { value: "Entrance", label: "Entrance" },
  { value: "LaundryRoom", label: "Laundry room" },
  { value: "Parking", label: "Parking" },
  { value: "YardOrOutside", label: "Yard or outside" },
  { value: "Other", label: "Other" },
];

export const PERMISSIONS: Option[] = [
  { value: "AnyTime", label: "Any time" },
  { value: "OnlyWhenHome", label: "Only when I am home" },
  { value: "CallFirst", label: "Call me first" },
];

export const BEST_TIMES: Option[] = [
  { value: "WeekdayMornings", label: "Weekday mornings" },
  { value: "WeekdayAfternoons", label: "Weekday afternoons" },
  { value: "Evenings", label: "Evenings" },
  { value: "Weekends", label: "Weekends" },
];

export const CONTACT_METHODS: Option[] = [
  { value: "Phone", label: "Phone" },
  { value: "Text", label: "Text" },
  { value: "Email", label: "Email" },
];

// The label for a value in one of the lists above (the value itself when it is not found).
export function labelOf(options: Option[], value: string | null | undefined): string {
  return options.find((option) => option.value === value)?.label ?? value ?? "";
}

export const STATUS_PILL: Record<RequestStatus, { label: string; className: string }> = {
  New: { label: "New", className: "bg-brand-green-tint text-brand-green-dark" },
  InProgress: { label: "In progress", className: "bg-accent-tint text-accent-dark" },
  Done: { label: "Done", className: "bg-green-100 text-green-800" },
  Cancelled: { label: "Cancelled", className: "bg-subtle text-body" },
};

// The line under a request in the list. A tenant only hears about the visit and the parts date, never about quotes or offers, so every
// other stage reads as "your landlord is arranging a repair".
export function progressLine(request: Pick<RequestListItem, "status" | "progress" | "progressDate" | "updatedAt">): string {
  if (request.status === "Done") return `Done ${formatCalendarDate(request.updatedAt)}`;
  if (request.status === "Cancelled") return `Cancelled ${formatCalendarDate(request.updatedAt)}`;
  if (request.status === "New") return "Waiting for your landlord";

  const day = request.progressDate ? formatCalendarDate(request.progressDate) : null;
  if (request.progress === "VisitScheduled") return day ? `Visit ${day}` : "Visit planned";
  if (request.progress === "WaitingForParts") return day ? `Waiting for parts, expected ${day}` : "Waiting for parts";
  return "Your landlord is arranging a repair";
}

// "Dave's Plumbing: Thu, Nov 6, morning" or "Dave's Plumbing: waiting for parts, expected Nov 20".
export function visitLine(visit: TenantVisit): string {
  if (visit.waitingForParts) {
    const expected = visit.partsExpectedBy ? `, expected ${formatCalendarDate(visit.partsExpectedBy)}` : "";
    return `${visit.contractorName}: waiting for parts${expected}`;
  }
  if (!visit.visitDate) return `${visit.contractorName} has the job`;
  const window = visit.visitWindow ? `, ${visit.visitWindow.toLowerCase()}` : "";
  return `${visit.contractorName}: ${formatCalendarDate(visit.visitDate)}${window}`;
}

// A short sentence for "Getting into your unit", for example "Call me first · Back entrance · Weekday afternoons, Evenings · Phone · Pets".
export function accessSummary(access: AccessDetails | AccessInput): string {
  const parts: string[] = [labelOf(PERMISSIONS, access.permissionToEnter)];
  if (access.accessNotes) parts.push(access.accessNotes);
  if (access.bestTimes.length > 0) parts.push(access.bestTimes.map((time) => labelOf(BEST_TIMES, time)).join(", "));
  if (access.contactMethod) parts.push(`${labelOf(CONTACT_METHODS, access.contactMethod)}${access.contactPhone ? ` ${access.contactPhone}` : ""}`);
  if (access.hasPets !== null) parts.push(access.hasPets ? "Pets in the unit" : "No pets");
  return parts.join(" · ");
}

// Moments in time are shown in the person's own time zone, so they are formatted in the browser (see components/local-moment.tsx).
export function formatMoment(iso: string): string {
  return new Date(iso).toLocaleString("en-CA", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export const URGENCIES: Option[] = [
  { value: "Low", label: "Low" },
  { value: "Normal", label: "Normal" },
  { value: "High", label: "High" },
  { value: "Emergency", label: "Emergency" },
];

export const URGENCY_PILL: Record<Urgency, string> = {
  Low: "bg-subtle text-body",
  Normal: "bg-subtle text-body",
  High: "bg-amber-100 text-amber-900",
  Emergency: "bg-red-100 text-red-800",
};

// The landlord's line under a status: unlike the tenant's, it names quotes, offers and contractors.
// `quotesReceived` and `quotesOpen` come from the request page; the list does not have them.
export function landlordProgressLine(
  request: Pick<RequestListItem, "status" | "progress" | "progressDate">,
  quotes?: { received: number; open: number },
): string | null {
  if (request.status !== "InProgress") return null;
  const day = request.progressDate ? formatCalendarDate(request.progressDate) : null;
  switch (request.progress) {
    case "QuotesRequested":
      return quotes ? `Waiting for quotes (${quotes.received} of ${quotes.open} received)` : "Waiting for quotes";
    case "Offered":
      return "Offered to a contractor";
    case "Accepted":
      return "Contractor accepted";
    case "VisitScheduled":
      return day ? `Visit ${day}` : "Visit planned";
    case "WaitingForParts":
      return day ? `Waiting for parts, expected ${day}` : "Waiting for parts";
    default:
      return null;
  }
}
