import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth-card";
import { ErrorNote, inputClass, primaryButtonClass } from "@/components/form-bits";
import { getTwoFactorToken } from "@/lib/auth-session";
import { recoveryLoginAction, verifyTwoFactorAction } from "../actions";
import { CodeBoxes } from "../code-boxes";

export const metadata: Metadata = { title: "Two-step verification" };

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; mode?: string }>;
}) {
  const { error, mode } = await searchParams;

  if (!(await getTwoFactorToken())) {
    redirect("/login");
  }

  const recovery = mode === "recovery";

  return (
    <AuthCard step={2}>
      <h1 className="mb-1.5 text-[25px] font-medium tracking-tight">
        {recovery ? "Use a recovery code" : "Two-step verification"}
      </h1>
      <p className="mb-6 text-sm leading-normal text-ink-2">
        {recovery
          ? "Enter one of the recovery codes you saved. Each code works once."
          : "Enter the 6-digit code from your authenticator app."}
      </p>

      <ErrorNote message={error} />

      <form action={recovery ? recoveryLoginAction : verifyTwoFactorAction} className="flex flex-col">
        {recovery ? (
          <>
            <label htmlFor="recoveryCode" className="mb-1.5 text-[13px] text-ink-2">
              Recovery code
            </label>
            <input
              id="recoveryCode"
              name="recoveryCode"
              type="text"
              required
              autoFocus
              autoComplete="off"
              spellCheck={false}
              className={`${inputClass} mb-5`}
            />
            <button type="submit" className={primaryButtonClass}>
              Verify and sign in
            </button>
          </>
        ) : (
          <>
            <CodeBoxes invalid={Boolean(error)} />
            <p className="mb-5 mt-3 text-xs text-ink-3">Code expires in 5 minutes</p>
            <button type="submit" className={primaryButtonClass}>
              Verify and sign in
              <span aria-hidden="true">→</span>
            </button>
          </>
        )}
      </form>

      <div className="mt-5 flex flex-col items-center gap-3 text-[13px]">
        <Link
          href={recovery ? "/login/two-factor/verify" : "/login/two-factor/verify?mode=recovery"}
          className="text-brand-text hover:underline"
        >
          {recovery ? "Use your authenticator app instead" : "Use a recovery code instead"}
        </Link>
        <Link href="/login" className="text-ink-2 hover:text-ink">
          ← Back to sign in
        </Link>
      </div>
    </AuthCard>
  );
}
