"use client";

// A Back button and breadcrumbs ("Dashboard > Properties > Property") for pages nested inside the landlord or tenant portal. The trail
// comes from the page address (lib/breadcrumb-trail.ts). `title` is the current page; the tenant pages draw their own heading, so there
// it is left out. Shows nothing on the dashboard and on top-level pages.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { breadcrumbTrail } from "@/lib/breadcrumb-trail";

export function Breadcrumbs({ title }: { title?: string }) {
  const trail = breadcrumbTrail(usePathname());
  if (trail.length === 0) return null;
  const parent = trail[trail.length - 1];

  return (
    <nav aria-label="Breadcrumb" className="mb-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-slate-500">
      <Link href={parent.href} className="mr-1 inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 font-semibold text-slate-700 hover:bg-slate-50">
        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m15 18-6-6 6-6" />
        </svg>
        Back
      </Link>
      {trail.map((crumb) => (
        <span key={crumb.href} className="flex items-center gap-1.5">
          <Link href={crumb.href} className="hover:text-slate-900 hover:underline">
            {crumb.label}
          </Link>
          <span aria-hidden="true">&rsaquo;</span>
        </span>
      ))}
      {title && (
        <span className="max-w-[18rem] truncate font-semibold text-slate-700" aria-current="page">
          {title}
        </span>
      )}
    </nav>
  );
}
