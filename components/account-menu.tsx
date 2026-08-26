"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { logoutAction } from "@/app/actions";

interface AccountMenuProps {
  email: string;
  role: string;
}

export function AccountMenu({ email, role }: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initials = email.slice(0, 2).toUpperCase();

    return (
    <div className="flex items-center gap-2 sm:gap-4">
      <span className="hidden sm:inline-flex text-xs font-semibold text-brand-green-dark bg-brand-green-tint px-2.5 py-1 rounded-full">
        {role}
      </span>
      <Link
        href="/landlord/billing"
        className="hidden sm:inline-flex items-center rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
      >
        Upgrade
      </Link>
      <button type="button" className="text-slate-400 hover:text-slate-600 transition" aria-label="Notifications">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      </button>
      <div className="hidden sm:block w-px h-6 bg-slate-200" />
      <div className="relative" ref={ref}>
        <button type="button" onClick={() => setOpen((v) => !v)} className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-brand-blue text-white text-xs font-semibold flex items-center justify-center">
            {initials}
          </span>
          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-56 rounded-lg border border-slate-200 bg-white shadow-lg py-1 z-40">
            <div className="px-3 py-2 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-900 truncate">{role}</p>
              <p className="text-xs text-slate-500 truncate" title={email}>{email}</p>
            </div>
            <Link href="/landlord/profile" className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50" onClick={() => setOpen(false)}>
              Profile
            </Link>
            <Link href="/landlord/settings" className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50" onClick={() => setOpen(false)}>
              Settings
            </Link>
            <div className="border-t border-slate-100 mt-1 pt-1">
              <form action={logoutAction}>
                <button type="submit" className="w-full text-left px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
                  Sign out
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}