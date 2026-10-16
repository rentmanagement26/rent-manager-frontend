import { PendingOverlay } from "@/components/pending-overlay";
import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth-card";
import { ErrorNote, inputClass, primaryButtonClass } from "@/components/form-bits";
import { resetPasswordAction } from "./actions";

export const metadata: Metadata = { title: "Set new password" };

// /login/reset-password?userId=...&token=...
// Step 2 of resetting an admin password. The backend's email puts userId and token in the link; this page
// carries them in hidden fields so the form can send them back with the new password.
// The backend address for this page is the setting Frontend:AdminResetPasswordUrl (in the backend config).
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ userId?: string; token?: string; error?: string; done?: string }>;
}) {
  const { userId, token, error, done } = await searchParams;

  // Success screen.
  if (done) {
    return (
      <AuthCard step={1}>
        <h1 className="mb-1.5 text-[25px] font-medium tracking-tight">Password updated</h1>
        <p className="mb-6 text-sm leading-normal text-ink-2">Your password was changed. Sign in with the new one.</p>
        <Link href="/login" className={primaryButtonClass}>
          Go to sign in
        </Link>
      </AuthCard>
    );
  }

  // Opened without the values the emailed link carries (or someone typed the address by hand).
  if (!userId || !token) {
    return (
      <AuthCard step={1}>
        <h1 className="mb-1.5 text-[25px] font-medium tracking-tight">Link not valid</h1>
        <p className="mb-6 text-sm leading-normal text-ink-2">This reset link is incomplete or has already been used.</p>
        <Link href="/login/forgot-password" className={primaryButtonClass}>
          Get a new link
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard step={1}>
      <h1 className="mb-1.5 text-[25px] font-medium tracking-tight">Choose a new password</h1>
      <p className="mb-6 text-sm leading-normal text-ink-2">
        After this you&apos;ll sign in as usual, including your two-step code.
      </p>

      <ErrorNote message={error} />

      <form action={resetPasswordAction} className="flex flex-col">
<PendingOverlay />
        {/* Values from the emailed link, sent back with the form. */}
        <input type="hidden" name="userId" value={userId} />
        <input type="hidden" name="token" value={token} />

        <label htmlFor="newPassword" className="mb-1.5 text-[13px] text-ink-2">
          New password
        </label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          required
          autoFocus
          autoComplete="new-password"
          className={`${inputClass} mb-4`}
        />

        <label htmlFor="confirmPassword" className="mb-1.5 text-[13px] text-ink-2">
          Confirm new password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          autoComplete="new-password"
          className={`${inputClass} mb-5`}
        />

        <button type="submit" className={primaryButtonClass}>
          Set new password
        </button>
      </form>
    </AuthCard>
  );
}
