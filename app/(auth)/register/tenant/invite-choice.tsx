import Link from "next/link";
import type { ReactNode } from "react";

function Icon({ path, className }: { path: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className ?? "h-5 w-5"}
    >
      <path d={path} />
    </svg>
  );
}

const LOGIN_ICON =
  "M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9";
const USER_PLUS_ICON = "M15 19a6 6 0 00-12 0M9 11a4 4 0 100-8 4 4 0 000 8zM19 8v6M22 11h-6";
const CHEVRON_ICON = "M9 5l7 7-7 7";

export function InviteChoice({
  token,
  email,
  introCard,
}: {
  token: string;
  email: string;
  introCard: ReactNode;
}) {
  const base = `/register/tenant?token=${encodeURIComponent(token)}`;

  return (
    <>
      <h2 className="mb-1 font-head text-2xl font-bold text-heading">You&apos;re invited</h2>
      <p className="mb-4 text-sm text-muted">Sent to {email}</p>
      {introCard}

      <p className="mb-3 text-sm font-semibold text-heading">
        Do you already have a DomusPRO account?
      </p>

      <div className="flex flex-col gap-3">
        <Link
          href={`${base}&step=login`}
          className="flex items-center gap-3 rounded-xl border-[1.5px] border-accent bg-accent-tint px-4 py-3.5 text-heading"
        >
          <Icon path={LOGIN_ICON} className="h-5 w-5 text-accent" />
          <span className="flex-1">
            <span className="block font-semibold">Yes, log in</span>
            <span className="block text-sm text-body">Use your existing account</span>
          </span>
          <Icon path={CHEVRON_ICON} className="h-4 w-4 text-accent" />
        </Link>

        <Link
          href={`${base}&step=register`}
          className="flex items-center gap-3 rounded-xl border border-default bg-surface px-4 py-3.5 text-heading hover:border-accent"
        >
          <Icon path={USER_PLUS_ICON} className="h-5 w-5" />
          <span className="flex-1">
            <span className="block font-semibold">No, create an account</span>
            <span className="block text-sm text-body">Takes under a minute</span>
          </span>
          <Icon path={CHEVRON_ICON} className="h-4 w-4 text-muted" />
        </Link>
      </div>
    </>
  );
}