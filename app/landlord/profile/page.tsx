import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { SessionExpiredError } from "@/lib/api-error";
import { requireBackendToken } from "@/lib/auth-guard";
import { getInitials } from "@/lib/format-name";
import { getTwoFactorStatus } from "@/lib/two-factor-api";
import type { TwoFactorStatus } from "@/lib/types";
import { PasswordRow } from "./password-row";

export default async function ProfilePage() {
  const session = await requireBackendToken(["Admin", "Landlord"]);

  let twoFactor: TwoFactorStatus | null = null;
  try {
    twoFactor = await getTwoFactorStatus(session.backendToken);
  } catch (err) {
    if (!(err instanceof SessionExpiredError)) throw err;
  }

  if (!twoFactor) {
    redirect("/session-expired");
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Profile" description="Manage your account details." />

      <div className="max-w-2xl rounded-2xl border border-default bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-blue text-lg font-semibold text-white">
            {getInitials(session.fullName, session.email)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-semibold text-heading">{session.fullName || session.email}</p>
            <p className="truncate text-sm text-muted">{session.email}</p>
          </div>
          <span className="shrink-0 rounded-full bg-brand-green-tint px-2.5 py-1 text-xs font-semibold text-brand-green-dark">
            {session.role}
          </span>
        </div>

        <PasswordRow />

        <div className="flex items-center justify-between gap-4 border-t border-default pt-4">
          <div>
            <p className="text-sm font-medium text-heading">Two-factor authentication</p>
            <p className="text-sm text-muted">
              {twoFactor.enabled
                ? `On · ${twoFactor.recoveryCodesRemaining} recovery codes left`
                : "Off · set up the next time you log in"}
            </p>
          </div>
          <Link
            href="/landlord/settings"
            className="shrink-0 rounded-lg border border-default px-3.5 py-2 text-sm font-semibold text-heading hover:bg-subtle"
          >
            Manage
          </Link>
        </div>
      </div>
    </div>
  );
}
