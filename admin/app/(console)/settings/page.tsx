import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PasswordCard } from "@/components/console/password-card";
import { TwoFactorCard } from "@/components/console/two-factor-card";
import { Notice, cardClass } from "@/components/console/ui";
import { requireAdmin } from "@/lib/auth-guard";
import { getTwoFactorStatus } from "@/lib/two-factor-api";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await requireAdmin();
  const status = await getTwoFactorStatus(session.backendToken);

  if (status.status === "expired") {
    redirect("/session-expired");
  }

  return (
    <div className="flex max-w-3xl flex-col gap-5">
      <div className="animate-up">
        <h1 className="text-2xl font-medium tracking-tight">Settings</h1>
        <p className="mt-1 text-c-tx2">Protect your admin account.</p>
      </div>

      <div className="animate-up flex flex-col gap-5" style={{ animationDelay: "0.06s" }}>
        {status.status === "ok" ? (
          <TwoFactorCard status={status.data} />
        ) : (
          <section className={cardClass}>
            <h2 className="mb-3 text-base font-medium">Two-factor authentication</h2>
            <Notice>Couldn&apos;t load your two-factor status. Refresh to try again.</Notice>
          </section>
        )}
        <PasswordCard />
      </div>
    </div>
  );
}
