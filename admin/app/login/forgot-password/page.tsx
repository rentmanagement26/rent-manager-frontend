import { PendingOverlay } from "@/components/pending-overlay";
import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth-card";
import { ErrorNote, inputClass, primaryButtonClass } from "@/components/form-bits";
import { forgotPasswordAction } from "./actions";

export const metadata: Metadata = { title: "Forgot password" };

// /login/forgot-password
// Step 1 of resetting an admin password: the person types their work email and we ask the backend to email
// them a link. That link opens /login/reset-password, where they choose the new password.
export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const { error, sent } = await searchParams;

  return (
    <AuthCard step={1}>
      <h1 className="mb-1.5 text-[25px] font-medium tracking-tight">Reset your password</h1>

      {sent ? (
        // After sending. The wording is deliberately the same whether or not the account exists.
        <p className="mb-6 text-sm leading-normal text-ink-2">
          If a staff account exists for that email, a reset link is on its way. It can take a few minutes. Check your
          spam folder too.
        </p>
      ) : (
        <>
          <p className="mb-6 text-sm leading-normal text-ink-2">
            Enter your work email and we&apos;ll send you a link to choose a new password.
          </p>

          <ErrorNote message={error} />

          <form action={forgotPasswordAction} className="flex flex-col">
<PendingOverlay />
            <label htmlFor="email" className="mb-1.5 text-[13px] text-ink-2">
              Work email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoFocus
              autoComplete="username"
              placeholder="name@company.com"
              className={`${inputClass} mb-5`}
            />
            <button type="submit" className={primaryButtonClass}>
              Send reset link
            </button>
          </form>
        </>
      )}

      <p className="mt-5 text-center text-[13px]">
        <Link href="/login" className="text-ink-2 hover:text-ink">
          ← Back to sign in
        </Link>
      </p>
    </AuthCard>
  );
}
