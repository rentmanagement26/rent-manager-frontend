import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth-card";
import { ErrorNote, inputClass, primaryButtonClass } from "@/components/form-bits";
import { HOME_PATH } from "@/lib/auth-guard";
import { getSession } from "@/lib/get-session";
import { loginAction } from "./actions";

export const metadata: Metadata = { title: "Admin sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  // Already signed in: skip the form.
  const session = await getSession();
  if (session?.backendToken) {
    redirect(HOME_PATH);
  }

  return (
    <AuthCard step={1}>
      <h1 className="mb-1.5 text-[25px] font-medium tracking-tight">Admin sign in</h1>
      <p className="mb-6 text-sm leading-normal text-ink-2">Use your DomusPRO admin account to continue.</p>

      <ErrorNote message={error} />

      <form action={loginAction} className="flex flex-col">
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
          className={`${inputClass} mb-4`}
        />

        <label htmlFor="password" className="mb-1.5 text-[13px] text-ink-2">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="Your password"
          className={`${inputClass} mb-5`}
        />

        <button type="submit" className={primaryButtonClass}>
          Continue
          <span aria-hidden="true">→</span>
        </button>
      </form>

      <div className="mt-6 flex items-center gap-3 text-xs text-ink-3 before:h-px before:flex-1 before:bg-line after:h-px after:flex-1 after:bg-line">
        Authorised staff only
      </div>
      <p className="mt-3 text-center text-xs text-ink-3">Sign-ins and admin actions are recorded.</p>
    </AuthCard>
  );
}
