"use client";

import Link from "next/link";
import Image from "next/image";
import { logoutAction } from "@/app/actions";
import { useSidebar } from "@/lib/sidebar-context";

interface LandlordSidebarProps {
  role: string;
  email: string;
}

export function LandlordSidebar({ role, email }: LandlordSidebarProps) {
  const { open, setOpen } = useSidebar();

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/30 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-30 w-64 border-r border-slate-200 bg-white flex flex-col justify-between transition-transform lg:contents ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        
        <div className="lg:col-start-1 lg:row-start-1 lg:h-full flex items-center px-6 py-6 border-b border-slate-100 lg:border-slate-200 lg:bg-white">
          <Link href="/landlord" className="flex items-center gap-2">
            <Image src="/logo-sm.svg" alt="DomusPRO" width={50} height={50} priority />
            <div>
              <span className="font-bold text-slate-900 tracking-tight block text-base">
                DomusPRO
              </span>
              <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full inline-block mt-0.5">
                {role} Portal
              </span>
            </div>
          </Link>
        </div>

        <div className="flex-1 lg:col-start-1 lg:row-start-2 flex flex-col justify-between lg:overflow-y-auto lg:bg-white">
          <nav className="p-4 space-y-1">
            <Link
              href="/landlord"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium bg-blue-50 text-blue-700 transition"
            >
              Dashboard
            </Link>
            <Link
              href="/landlord/properties"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
            >
              Properties
            </Link>
            <Link
              href="/landlord/tenants"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
            >
              Tenants
            </Link>
          </nav>

          <div className="p-4 border-t border-slate-100 bg-slate-50/60 m-3 rounded-xl">
            <div className="mb-3 truncate">
              <p className="text-xs text-slate-500 font-medium">Logged in as</p>
              <p className="text-sm font-semibold text-slate-900 truncate" title={email}>
                {email}
              </p>
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}