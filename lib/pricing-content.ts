// What each plan says about itself on the pricing page and the Billing page: the tagline, the four highlights, the AI allowance and the
// full feature comparison. The wording and the differences are PLACEHOLDERS until the real ones are decided; edit this one file to change them.
// Prices, limits and the trial length are not here: they come from the backend (or from lib/pricing-public.ts on the public page).

export type PlanKey = "basic" | "pro" | "max";

export interface PlanCopy {
  key: PlanKey;
  tagline: string;
  highlights: string[];
  // Shown as the "Most popular" plan.
  popular?: boolean;
}

export const PLAN_COPY: Record<PlanKey, PlanCopy> = {
  basic: {
    key: "basic",
    tagline: "For one small property",
    highlights: ["1 property, 3 units", "Leases and online signing", "Renewal tracking", "10 AI tasks a month"],
  },
  pro: {
    key: "pro",
    tagline: "For a growing landlord",
    highlights: ["5 properties, 20 units", "Everything in Basic", "Renewal reminders by email and in the app", "200 AI tasks a month"],
    popular: true,
  },
  max: {
    key: "max",
    tagline: "For a full portfolio",
    highlights: ["25 properties, 100 units", "Everything in Pro", "Reports and year-end export", "1,000 AI tasks a month"],
  },
};

// The copy for a plan the backend calls "Pro", "pro", "PRO"...; null for a plan name we have no copy for (a custom plan).
export function copyFor(planName: string): PlanCopy | null {
  const key = planName.trim().toLowerCase();
  return key === "basic" || key === "pro" || key === "max" ? PLAN_COPY[key] : null;
}

// ---- AI assistant tasks. The landlord approves every action: the AI only prepares drafts. ----------------------

export interface AiTier {
  plan: PlanKey;
  tasksPerMonth: number;
  // How the AI prepares drafts on this plan.
  mode: string;
  note: string;
}

export const AI_TIERS: AiTier[] = [
  { plan: "basic", tasksPerMonth: 10, mode: "On request", note: "The AI drafts when you ask for it." },
  { plan: "pro", tasksPerMonth: 200, mode: "Scheduled drafts", note: "The AI prepares drafts on a schedule you set." },
  { plan: "max", tasksPerMonth: 1000, mode: "Smart approval queue", note: "Drafts are ranked in one queue, so you can approve several at once." },
];

// ---- The full comparison. A cell is true (included), false (not included) or text. Columns: Basic, Pro, Max. ---------

export type Cell = boolean | string;

export interface FeatureRow {
  label: string;
  values: [Cell, Cell, Cell];
  // The feature is not built yet.
  comingSoon?: boolean;
}

export interface FeatureGroup {
  title: string;
  // Tabler-style icon name used by the comparison (see components/pricing/plan-comparison.tsx).
  icon: "building" | "file" | "cash" | "tool" | "sparkles" | "headset";
  rows: FeatureRow[];
}

export const FEATURE_GROUPS: FeatureGroup[] = [
  {
    title: "Portfolio",
    icon: "building",
    rows: [
      { label: "Properties", values: ["1", "5", "25"] },
      { label: "Units", values: ["3", "20", "100"] },
      { label: "Users on the account", values: ["1", "2", "5"] },
    ],
  },
  {
    title: "Leases and documents",
    icon: "file",
    rows: [
      { label: "Lease documents", values: [true, true, true] },
      { label: "Online signing", values: [false, true, true] },
      { label: "Renewal tracking", values: [true, true, true] },
      { label: "Renewal reminders", values: [false, true, true] },
      { label: "Custom reminder schedule", values: [false, false, true] },
    ],
  },
  {
    title: "Money",
    icon: "cash",
    rows: [
      { label: "Online rent collection", values: [false, true, true], comingSoon: true },
      { label: "Expense tracking", values: [false, true, true], comingSoon: true },
      { label: "Reports and year-end export", values: [false, false, true], comingSoon: true },
    ],
  },
  {
    title: "Maintenance",
    icon: "tool",
    rows: [
      { label: "Maintenance requests", values: [true, true, true] },
      { label: "Contractor invoices", values: [false, true, true] },
    ],
  },
  {
    title: "AI assistant tasks",
    icon: "sparkles",
    rows: [
      { label: "AI tasks per month", values: ["10", "200", "1,000"] },
      { label: "When the AI prepares drafts", values: ["On request", "On a schedule", "Smart queue"] },
      { label: "You approve every action", values: [true, true, true] },
      { label: "Lease summary and key dates", values: [true, true, true] },
      { label: "Rent reminder drafts", values: [false, true, true] },
      { label: "Tenant message reply drafts", values: [false, true, true] },
      { label: "Maintenance triage and contractor suggestions", values: [false, false, true] },
      { label: "Approve several drafts at once", values: [false, false, true] },
      { label: "Full activity log", values: [false, true, true] },
    ],
  },
  {
    title: "Support",
    icon: "headset",
    rows: [{ label: "Support", values: ["Help centre", "Email", "Priority email"] }],
  },
];
