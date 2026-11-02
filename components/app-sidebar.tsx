"use client";

// The left menu shared by the landlord and tenant portals: white panel, an accent bar plus tinted background on the active page, a light
// background on hover, and the slide-in drawer on small screens. Each portal passes its own entries, an optional footer card and an
// optional note shown under the logo (the landlord's plan).
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useSidebar } from "@/lib/sidebar-context";

export interface SidebarItem {
  label: string;
  href: string;
  // True when only this exact path counts as "on this page" (a dashboard), false when its sub-pages count too.
  exact: boolean;
  // The icon drawing (a 24x24 outline path).
  icon: string;
}

export function AppSidebar({ homeHref, items, footer, logoNote }: { homeHref: string; items: SidebarItem[]; footer?: ReactNode; logoNote?: ReactNode }) {
  const { open, setOpen } = useSidebar();
  const pathname = usePathname();

  return (
    <>
      <div
        className={`max-lg:fixed max-lg:inset-0 max-lg:z-20 max-lg:bg-black/30 max-lg:transition-opacity lg:hidden ${
          open ? "max-lg:opacity-100" : "max-lg:pointer-events-none max-lg:opacity-0"
        }`}
        onClick={() => setOpen(false)}
      />

      <div
        className={`max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:z-30 max-lg:w-64 max-lg:border-r max-lg:border-slate-200 max-lg:bg-white max-lg:flex max-lg:flex-col max-lg:justify-between max-lg:transition-transform lg:contents ${
          open ? "max-lg:translate-x-0" : "max-lg:-translate-x-full"
        }`}
      >
        <div className="lg:col-start-1 lg:row-start-1 lg:h-full flex items-center justify-between px-6 py-5 lg:bg-white">
          <div className="flex flex-col items-start gap-2.5">
            <Link href={homeHref}>
              <Image src="/domuspro-logo.png" alt="DomusPRO" width={150} height={50} priority className="h-auto w-auto" />
            </Link>
            {logoNote}
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="lg:hidden rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            aria-label="Close menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="max-lg:flex-1 lg:col-start-1 lg:row-start-2 lg:row-span-2 flex flex-col justify-between lg:overflow-y-auto lg:min-h-0 lg:bg-white">
          <nav className="flex flex-col gap-1.5 py-3">
            {items.map((item) => {
              const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3.5 border-l-[3px] px-5 py-3.5 text-sm transition ${
                    active
                      ? "border-accent bg-accent-tint font-bold text-accent-dark"
                      : "border-transparent font-medium text-body hover:bg-subtle hover:text-heading"
                  }`}
                >
                  <svg className={`h-[18px] w-[18px] ${active ? "text-accent" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={item.icon} />
                  </svg>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {footer}
        </div>
      </div>
    </>
  );
}
