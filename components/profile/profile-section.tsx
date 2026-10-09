import Link from "next/link";
import { redirect } from "next/navigation";
import { SessionExpiredError } from "@/lib/api-error";
import { requireBackendToken } from "@/lib/auth-guard";
import { getInitials } from "@/lib/format-name";
import { getMyProfile } from "@/lib/profile-api";
import { getTwoFactorStatus } from "@/lib/two-factor-api";
import type { TwoFactorStatus, UserProfile } from "@/lib/types";
import { NameRow } from "./name-row";
import { PasswordRow } from "./password-row";

export async function ProfileSection({ settingsHref }: { settingsHref: string }) {
  const session = await requireBackendToken();

  let profile: UserProfile | null = null;
  let twoFactor: TwoFactorStatus | null = null;
  try {
    [profile, twoFactor] = await Promise.all([
      getMyProfile(session.backendToken),
      getTwoFactorStatus(session.backendToken),
    ]);
  } catch (err) {
    if (!(err instanceof SessionExpiredError)) throw err;
  }

  if (!profile || !twoFactor) {
    redirect("/session-expired");
  }

  return (
    <div className="max-w-2xl rounded-2xl border border-default bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-blue text-lg font-semibold text-white">
          {getInitials(profile.fullName, profile.email)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-semibold text-heading">{profile.fullName || profile.email}</p>
          <p className="truncate text-sm text-muted">{profile.email}</p>
        </div>
        <span className="shrink-0 rounded-full bg-brand-green-tint px-2.5 py-1 text-xs font-semibold text-brand-green-dark">
          {session.role}
        </span>
      </div>

      <NameRow profile={profile} />
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
          href={settingsHref}
          className="shrink-0 rounded-lg border border-default px-3.5 py-2 text-sm font-semibold text-heading hover:bg-subtle"
        >
          Manage
        </Link>
      </div>
    </div>
  );
}
