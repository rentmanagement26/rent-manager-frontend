import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";

export function AuthSplitLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex flex-1 flex-col md:flex-row">
      <div className="relative flex flex-col justify-between gap-6 overflow-hidden bg-linear-to-br from-accent to-accent-dark p-8 text-white md:w-[420px] md:flex-shrink-0 md:gap-14 md:p-14">
        <div className="pointer-events-none absolute -right-20 -top-40 h-72 w-72 rounded-full border border-white/15" />
        <Link href="/" className="flex items-center">
          <Image src="/domouspro-white-logo.png" alt="DomusPRO" width={180} height={60} priority className="h-auto" />
        </Link>
        <h1 className="max-w-xs font-head text-2xl font-extrabold leading-tight md:text-3xl">
          Manage your rentals without the chaos.
        </h1>
        <ul className="hidden flex-col gap-3 text-sm text-white/90 md:flex">
          <li>Property &amp; unit management</li>
          <li>Tenant portal</li>
          <li>Digital leases</li>
          <li>Online rent payments</li>
        </ul>
      </div>

      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </main>
  );
}