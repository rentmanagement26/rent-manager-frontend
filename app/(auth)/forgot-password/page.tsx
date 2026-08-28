import Link from "next/link";
import { forgotPasswordAction } from "@/app/(auth)/forgot-password/actions";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const { error, sent } = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <h2 className="mb-2 font-head text-2xl font-bold text-heading">Forgot password</h2>
        <p className="mb-6 text-sm text-muted">
          Enter your email and we&apos;ll send you a link to reset your password.
        </p>

        {sent && (
          <p className="mb-4 rounded-lg bg-green-50 px-3 py-2.5 text-sm font-medium text-green-700">
            If an account with that email exists, a password reset link has been sent.
          </p>
        )}

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">
            {error}
          </p>
        )}

        <form action={forgotPasswordAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-semibold text-body">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="rounded-xl border border-default px-3.5 py-2.5 text-heading outline-none focus:border-accent"
            />
          </div>

          <button
            type="submit"
            className="mt-2 rounded-xl bg-accent px-4 py-3 font-semibold text-white shadow-lg shadow-accent/25 hover:bg-accent-dark"
          >
            Send reset link
          </button>

          <Link href="/login" className="text-center text-sm text-muted">
            Back to login
          </Link>
        </form>
      </div>
    </main>
  );
}