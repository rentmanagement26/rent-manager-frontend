"use client";

import {
  Bell,
  Building2,
  CreditCard,
  House,
  LayoutGrid,
  LifeBuoy,
  Menu,
  Moon,
  ScrollText,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sun,
  UserCog,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

type Theme = "light" | "dark";

interface NavItem {
  label: string;
  icon: LucideIcon;
  // No href means the page isn't built yet.
  href?: string;
}

const MENU: NavItem[] = [
  { label: "Overview", icon: LayoutGrid, href: "/overview" },
  { label: "Landlords", icon: Users },
  { label: "Tenants", icon: House },
  { label: "Properties", icon: Building2 },
  { label: "Billing", icon: CreditCard },
  { label: "Support", icon: LifeBuoy },
];

const SECURITY: NavItem[] = [
  { label: "Audit log", icon: ScrollText, href: "/audit-log" },
  { label: "Audit settings", icon: SlidersHorizontal, href: "/audit-settings" },
  { label: "Admin team", icon: ShieldCheck },
];

const ACCOUNT: NavItem[] = [{ label: "Settings", icon: Settings, href: "/settings" }];

const ITEM_HEIGHT_PX = 40;

function initials(fullName: string) {
  return fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function NavGroup({ title, items, pathname, onNavigate }: { title: string; items: NavItem[]; pathname: string; onNavigate: () => void }) {
  const activeIndex = items.findIndex((item) => item.href && pathname.startsWith(item.href));

  return (
    <div>
      <div className="px-3 py-1.5 text-[11px] tracking-[0.08em] text-c-tx3">{title}</div>
      <div className="relative">
        {activeIndex >= 0 && (
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-10 rounded-[10px] bg-c-aci transition-transform duration-350 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{ transform: `translateY(${activeIndex * ITEM_HEIGHT_PX}px)` }}
          />
        )}
        {items.map((item, index) => {
          const Icon = item.icon;
          const active = index === activeIndex;
          const base = "relative flex h-10 items-center gap-3 rounded-[10px] px-3 text-sm";

          if (!item.href) {
            return (
              <div key={item.label} aria-disabled className={`${base} cursor-not-allowed text-c-tx2 opacity-50`}>
                <Icon size={19} strokeWidth={1.75} />
                {item.label}
                <span className="ml-auto rounded-[10px] bg-c-sf2 px-1.75 py-px text-[10px] text-c-tx3">Soon</span>
              </div>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={onNavigate}
              className={`${base} ${active ? "font-medium text-c-act2" : "text-c-tx2 hover:bg-c-sf2 hover:text-c-tx"}`}
            >
              <Icon size={19} strokeWidth={1.75} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function ConsoleShell({
  initialTheme,
  fullName,
  role,
  logoutAction,
  children,
}: {
  initialTheme: Theme;
  fullName: string;
  role: string;
  logoutAction: () => Promise<void>;
  children: ReactNode;
}) {
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();

  function toggleTheme() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    // Read by the layout on the next request so the page never flashes the wrong theme.
    document.cookie = `admin_theme=${next}; path=/; max-age=31536000; samesite=strict`;
  }

  const sidebar = (
    <div className="flex h-full flex-col gap-4 px-3.5 py-5">
      <div className="px-2 pb-1.5">
        <Image
          src={theme === "dark" ? "/domouspro-white-logo.png" : "/domuspro-logo.png"}
          alt="DomusPRO"
          width={160}
          height={53}
          priority
          className="h-auto w-36"
        />
      </div>
      <NavGroup title="MENU" items={MENU} pathname={pathname} onNavigate={() => setDrawerOpen(false)} />
      <NavGroup title="SECURITY" items={SECURITY} pathname={pathname} onNavigate={() => setDrawerOpen(false)} />
      <NavGroup title="ACCOUNT" items={ACCOUNT} pathname={pathname} onNavigate={() => setDrawerOpen(false)} />
    </div>
  );

  return (
    <div
      data-theme={theme}
      className="console grid min-h-screen bg-c-bg text-sm text-c-tx transition-colors duration-400 lg:grid-cols-[240px_minmax(0,1fr)]"
    >
      <aside className="sticky top-0 hidden h-screen border-r border-c-bd bg-c-sf transition-colors duration-400 lg:block">
        {sidebar}
      </aside>

      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/40"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="animate-up relative h-full w-65 border-r border-c-bd bg-c-sf">
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setDrawerOpen(false)}
              className="absolute right-3 top-4 flex size-9 items-center justify-center rounded-[10px] text-c-tx2 hover:bg-c-sf2"
            >
              <X size={18} />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-c-bd bg-c-sf px-4 py-3 transition-colors duration-400 sm:px-8">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setDrawerOpen(true)}
            className="flex size-9.5 items-center justify-center rounded-[10px] border border-c-bd text-c-tx2 hover:bg-c-sf2 lg:hidden"
          >
            <Menu size={18} />
          </button>
          <label className="hidden h-9.5 w-85 items-center gap-2 rounded-[10px] border border-c-bd bg-c-bg px-3 text-c-tx3 focus-within:border-c-ac md:flex">
            <Search size={16} />
            <input
              placeholder="Search is coming soon"
              disabled
              className="h-full min-w-0 flex-1 bg-transparent text-sm text-c-tx outline-none placeholder:text-c-tx3"
            />
          </label>
          <div className="flex-1" />
          <button
            type="button"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            onClick={toggleTheme}
            className="flex size-9.5 items-center justify-center rounded-[10px] border border-c-bd text-c-tx2 transition hover:bg-c-sf2 hover:text-c-tx active:scale-[0.93]"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            type="button"
            aria-label="Notifications (coming soon)"
            className="hidden size-9.5 cursor-not-allowed items-center justify-center rounded-[10px] border border-c-bd text-c-tx3 sm:flex"
          >
            <Bell size={18} />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-c-aci text-xs font-medium text-c-act2">
              {initials(fullName)}
            </div>
            <div className="hidden leading-tight sm:block">
              <div className="text-sm font-medium">{fullName}</div>
              <div className="text-xs text-c-tx3">{role}</div>
            </div>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              aria-label="Sign out"
              className="flex h-9.5 items-center gap-1.5 rounded-[10px] border border-c-bd2 px-3.5 text-[13px] transition hover:bg-c-sf2 active:scale-[0.96]"
            >
              <UserCog size={16} className="sm:hidden" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </form>
        </header>
        <main className="mx-auto w-full max-w-7xl p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
