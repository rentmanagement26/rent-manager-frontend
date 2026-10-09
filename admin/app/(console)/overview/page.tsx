import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth-guard";

export const metadata: Metadata = { title: "Overview" };

export default async function OverviewPage() {
  const session = await requireAdmin();

  return (
    <div className="animate-rise">
      <h1 className="text-2xl font-medium tracking-tight">Overview</h1>
      <p className="mt-1 text-ink-2">You&apos;re signed in as {session.email}.</p>
      <div className="mt-6 max-w-xl rounded-2xl border border-line bg-surface p-6 text-sm text-ink-2">
        The console pages (audit log, audit settings and the dashboard) are built next.
      </div>
    </div>
  );
}
