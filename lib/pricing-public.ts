// The plans shown on the PUBLIC pricing page, where nobody is signed in. The backend has no public plans call yet, so the names and
// prices are written here. When it does, replace this with that call (the Billing page already reads the live plans from the backend).
// Keep these in step with the Plans screen in the admin console until then.

export interface PublicPlan {
  key: "basic" | "pro" | "max";
  name: string;
  monthly: number;
  // null when the plan is free or has no yearly price.
  yearly: number | null;
}

export const PUBLIC_PLANS: PublicPlan[] = [
  { key: "basic", name: "Basic", monthly: 0, yearly: null },
  { key: "pro", name: "Pro", monthly: 20, yearly: 220 },
  { key: "max", name: "Max", monthly: 49, yearly: 539 },
];

// Months of free trial a new landlord gets on a paid plan (the backend's Stripe:TrialMonths).
export const PUBLIC_TRIAL_MONTHS = 1;
