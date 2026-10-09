import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthSplitLayout } from "@/components/auth-split-layout";
import { isSafeRedirectTarget } from "@/lib/auth-guard";
import { getTwoFactorToken } from "@/lib/auth-session";
import { recoveryLoginAction, verifyTwoFactorAction } from "../actions";

const inputClass =
  "rounded-xl border border-default px-3.5 py-2.5 text-heading outline-none focus:border-accent";
const buttonClass =
  "mt-2 rounded-xl bg-accent px-4 py-3 font-semibold text-white shadow-lg shadow-accent/25 hover:bg-accent-dark";

export default async function TwoFactorVerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; redirect?: string; mode?: string }>;
}) {
  const { error, redirect: redirectParam, mode } = await searchParams;

  if (!(await getTwoFactorToken())) {
    redirect("/login");
  }

  const recovery = mode === "recovery";
  const redirectTo = isSafeRedirectTarget(redirectParam) ? redirectParam : "";

  const switchParams = new URLSearchParams();
  if (redirectTo) switchParams.set("redirect", redirectTo);
  if (!recovery) switchParams.set("mode", "recovery");
  const switchQuery = switchParams.size > 0 ? `?${switchParams.toString()}` : "";

  return (
    <AuthSplitLayout>
      <h2 className="mb-2 font-head text-2xl font-bold text-heading">
        {recovery ? "Use a recovery code" : "Two-factor verification"}
      </h2>
      <p className="mb-6 text-sm text-muted">
        {recovery
          ? "Enter one of the recovery codes you saved. Each code works once."
          : "Enter the 6-digit code from your authenticator app."}
      </p>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">{error}</p>
      )}

      <form
        action={recovery ? recoveryLoginAction : verifyTwoFactorAction}
        className="flex flex-col gap-4"
      >
        <input type="hidden" name="redirect" value={redirectTo} />
        <div className="flex flex-col gap-1.5">
          <label htmlFor={recovery ? "recoveryCode" : "code"} className="text-sm font-semibold text-body">
            {recovery ? "Recovery code" : "Authentication code"}
          </label>
          {recovery ? (
            <input
              id="recoveryCode"
              name="recoveryCode"
              type="text"
              required
              autoFocus
              autoComplete="off"
              spellCheck={false}
              className={inputClass}
            />
          ) : (
            <input
              id="code"
              name="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              maxLength={7}
              required
              autoFocus
              className={`${inputClass} text-center text-xl tracking-[0.4em]`}
            />
          )}
        </div>

        <button type="submit" className={buttonClass}>
          Verify
        </button>

        <Link href={`/login/two-factor/verify${switchQuery}`} className="text-center text-sm text-accent hover:text-accent-dark">
          {recovery ? "Use your authenticator app instead" : "Use a recovery code instead"}
        </Link>
        <Link href="/login" className="text-center text-sm text-muted">
          Back to log in
        </Link>
      </form>
    </AuthSplitLayout>
  );
}
