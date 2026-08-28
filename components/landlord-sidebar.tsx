"use client";

import Link from "next/link";
import Image from "next/image";
import { useSidebar } from "@/lib/sidebar-context";

interface LandlordSidebarProps {
  email: string;
}

export function LandlordSidebar({ email }: LandlordSidebarProps) {
  const { open, setOpen } = useSidebar();

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
        <div className="lg:col-start-1 lg:row-start-1 lg:h-full flex items-center justify-between px-6 py-6 max-lg:border-b max-lg:border-slate-100 lg:bg-white">
          <Link href="/landlord">
            <Image
              src="/domuspro-logo.png"
              alt="DomusPRO"
              width={140}
              height={32}
              priority
              className="h-auto w-auto"
            />
          </Link>
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

        <div className="max-lg:flex-1 lg:col-start-1 lg:row-start-2 flex flex-col justify-between lg:overflow-y-auto lg:min-h-0 lg:bg-white">
          <nav className="p-4 space-y-1">
            <Link
              href="/landlord"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium bg-blue-50 text-brand-blue transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Dashboard
            </Link>
            <Link
              href="/landlord/properties"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Properties
            </Link>
            <Link
              href="/landlord/tenants"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Tenants
            </Link>
          </nav>

          <div className="m-3 p-4 rounded-xl bg-gradient-to-br from-brand-green-tint to-blue-50 border border-brand-green/30">
            <p className="text-xs font-semibold text-slate-900">Free plan</p>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Upgrade for more properties and priority support.
            </p>
            <Link
              href="/landlord/billing"
              className="mt-3 block text-center w-full px-3 py-2 text-xs font-semibold text-white bg-brand-blue hover:opacity-90 rounded-lg transition"
            >
              View plans
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}