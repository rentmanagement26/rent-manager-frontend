"use client";

// The landlord's menu entries and the card at the bottom, on top of the shared sidebar. The card is "Upgrade to Pro" on the free plan, and a
// "Your plan" summary with a Manage subscription link once the landlord is on a paid plan.
import Link from "next/link";
import { AppSidebar, type SidebarItem } from "@/components/app-sidebar";
import type { SidebarPlan } from "@/lib/sidebar-plan";

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
    label: "Activity",
    href: "/landlord/activity",
    exact: false,
    icon: "M12 8v4l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z",
  },
];

// The footer card for a landlord on a paid plan: the plan name, how much of the first limit is used, and a link to manage the subscription.
function YourPlanCard({ plan }: { plan: SidebarPlan }) {
  const share = plan.usage && plan.usage.limit > 0 ? Math.min(100, (plan.usage.used / plan.usage.limit) * 100) : 0;
  return (
    <div className="m-3 p-4 rounded-xl bg-heading shadow-lg shadow-heading/20">
      <p className="text-xs font-semibold text-accent-tint flex items-center gap-1.5">
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2.5 6l3 2 4.5-5 4.5 5 3-2-1.5 9h-12L2.5 6z" />
        </svg>
        Your plan
      </p>
      <p className="mt-1 font-head text-xl font-extrabold text-white">{plan.name}</p>
      {plan.usage && (
        <div className="mt-2">
          <p className="text-[11px] text-white/60">
            {plan.usage.label}: {plan.usage.used} of {plan.usage.limit}
          </p>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/15">
            <div className="h-full rounded-full bg-accent" style={{ width: `${share}%` }} />
          </div>
        </div>
      )}
      <Link
        href="/landlord/billing"
        className="mt-3 block text-center w-full px-3 py-2 text-xs font-semibold text-white border border-white/30 hover:bg-white/10 rounded-full transition"
      >
        Manage subscription
      </Link>
    </div>
  );
}

// The footer card for a landlord on the free plan.
function UpgradeCard() {
  return (
    <div className="m-3 p-4 rounded-xl bg-heading shadow-lg shadow-heading/20">
      <p className="text-xs font-semibold text-accent-tint flex items-center gap-1.5">
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2.5 6l3 2 4.5-5 4.5 5 3-2-1.5 9h-12L2.5 6z" />
        </svg>
        Upgrade to Pro
      </p>
      <p className="text-[11px] text-white/60 mt-1 leading-relaxed">Unlock unlimited properties and priority support.</p>
      <Link
        href="/landlord/billing"
        className="mt-3 block text-center w-full px-3 py-2 text-xs font-semibold text-white bg-accent hover:bg-accent-dark rounded-full transition"
      >
        View plans
      </Link>
    </div>
  );
}

// `plan` is null when it could not be read (then the free-plan card is shown).
export function LandlordSidebar({ plan }: { plan: SidebarPlan | null }) {
  return <AppSidebar homeHref="/landlord" items={NAV_ITEMS} footer={plan?.paid ? <YourPlanCard plan={plan} /> : <UpgradeCard />} />;
}
