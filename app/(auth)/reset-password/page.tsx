import { resetPasswordAction } from "@/app/(auth)/reset-password/actions";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ userId?: string; token?: string; error?: string }>;
}) {
  const { userId, token, error } = await searchParams;

  if (!userId || !token) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center p-8 text-center">
        <p className="rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">
          Invalid or expired reset link.
        </p>
      </main>
    );
  }

  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <h2 className="mb-2 font-head text-2xl font-bold text-heading">Reset password</h2>
        <p className="mb-6 text-sm text-muted">Enter a new password for your account.</p>

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">
            {error}
          </p>
        )}

        <form action={resetPasswordAction} className="flex flex-col gap-4">
          <input type="hidden" name="userId" value={userId} />
          <input type="hidden" name="token" value={token} />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="newPassword" className="text-sm font-semibold text-body">
              New password
            </label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              required
              className="rounded-xl border border-default px-3.5 py-2.5 text-heading outline-none focus:border-accent"
            />
          </div>

          <button
            type="submit"
            className="mt-2 rounded-xl bg-accent px-4 py-3 font-semibold text-white shadow-lg shadow-accent/25 hover:bg-accent-dark"
          >
            Reset password
          </button>
        </form>
      </div>
    </main>
  );
}