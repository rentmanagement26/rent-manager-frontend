"use client";

// The landlord's menu entries, on top of the shared sidebar, with the plan chip under the logo. Plan details live under Settings.
import Link from "next/link";
import { AppSidebar, type SidebarItem } from "@/components/app-sidebar";
import type { HeaderPlan } from "@/lib/header-plan";

// Where each entry goes, which paths count as "on this page", and the icon drawing.
const NAV_ITEMS: SidebarItem[] = [
  {
    label: "Dashboard",
    href: "/landlord",
    exact: true,
    icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z",
  },
  {
    label: "Properties",
    href: "/landlord/properties",
    exact: false,
    icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
  },
  {
    label: "Tenants",
    href: "/landlord/tenants",
    exact: false,
    icon: "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z",
  },
  {
    label: "Leases",
    href: "/landlord/leases",
    exact: false,
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  },
  {
    label: "Renewals",
    href: "/landlord/renewals",
    exact: false,
    icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
  },
  {
    label: "Maintenance",
    href: "/landlord/maintenance",
    exact: false,
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01",
  },
  {
    label: "Activity",
    href: "/landlord/activity",
    exact: false,
    icon: "M12 8v4l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z",
  },
];

// The plan under the logo: an orange "Pro plan" or "Max plan" chip with a crown for a paid plan, a grey "Free plan" chip with an Upgrade link
// for the free plan. It opens the plan details under Settings (or the plans on Billing for the free plan). Nothing is shown if the plan
// could not be read.
function PlanChip({ plan }: { plan: HeaderPlan | null }) {
  if (!plan) return null;
  if (plan.paid) {
    return (
      <Link
        href="/landlord/settings#subscription"
        title="Your plan"
        className="inline-flex items-center gap-1.5 rounded-full bg-accent-tint px-2.5 py-1 text-[11px] font-bold text-accent-dark transition hover:bg-orange-100"
      >
        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M2.5 6l3 2 4.5-5 4.5 5 3-2-1.5 9h-12L2.5 6z" />
        </svg>
        {plan.name} plan
      </Link>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 text-[11px] font-semibold">
      <Link href="/landlord/settings#subscription" title="Your plan" className="rounded-full bg-slate-100 px-2.5 py-1 font-bold text-body transition hover:bg-slate-200">
        Free plan
      </Link>
      <Link href="/landlord/billing" className="text-accent hover:text-accent-dark">
        Upgrade
      </Link>
    </span>
  );
}

// `plan` is null when it could not be read.
export function LandlordSidebar({ plan }: { plan: HeaderPlan | null }) {
  return <AppSidebar homeHref="/landlord" items={NAV_ITEMS} logoNote={<PlanChip plan={plan} />} />;
}
