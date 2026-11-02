"use client";

// A Back button at the top of the page content, for pages that sit inside another page (a unit inside a property, a lease document, the
// Billing page...). It goes to the parent page worked out from the address (lib/breadcrumb-trail.ts). Shows nothing on the dashboard and on
// the main pages in the sidebar.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { backTarget } from "@/lib/breadcrumb-trail";

export function BackButton() {
  const target = backTarget(usePathname());
  if (!target) return null;

  return (
    <Link
      href={target.href}
      className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
    >
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m15 18-6-6 6-6" />
      </svg>
      Back{target.label === "Dashboard" ? "" : ` to ${target.label}`}
    </Link>
  );
}
