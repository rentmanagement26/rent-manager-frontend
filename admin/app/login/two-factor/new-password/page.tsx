import { PendingOverlay } from "@/components/pending-overlay";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth-card";
import { ErrorNote, inputClass, primaryButtonClass } from "@/components/form-bits";
import { getTwoFactorToken } from "@/lib/auth-session";
import { newPasswordAction } from "./actions";

export const metadata: Metadata = { title: "Choose your password" };

// /login/two-factor/new-password
// Shown right after signing in with a TEMPORARY password (a brand-new staff account, or the first SuperAdmin
// created from the backend config). The temporary password works once; here the person picks their own.
// This page lives under /login/two-factor because the short-lived token cookie is only sent to that path.
export default async function NewPasswordPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  // No token means they didn't just sign in (or it timed out): back to the sign-in form.
  if (!(await getTwoFactorToken())) redirect("/login");

  return (
    <AuthCard step={1}>
      <h1 className="mb-1.5 text-[25px] font-medium tracking-tight">Choose your password</h1>
      <p className="mb-6 text-sm leading-normal text-ink-2">
        You signed in with a temporary password. Choose your own to continue. You have about 10 minutes.
      </p>

      <ErrorNote message={error} />

      <form action={newPasswordAction} className="flex flex-col">
<PendingOverlay />
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
          Continue
          <span aria-hidden="true">→</span>
        </button>
      </form>

      <p className="mt-5 text-center text-[13px]">
        <Link href="/login" className="text-ink-2 hover:text-ink">
          ← Back to sign in
        </Link>
      </p>
    </AuthCard>
  );
}
