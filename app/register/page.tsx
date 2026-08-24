import Link from "next/link";
import { registerAction } from "./actions";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex flex-1 flex-col items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <h1 className="mb-2 font-head text-2xl font-bold text-heading">Create an account</h1>
        <Link href="/login" className="mb-6 block text-sm text-muted">
          Already have an account? Log in
        </Link>

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">
            {error}
          </p>
        )}

        <form action={registerAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="fullName" className="text-sm font-semibold text-body">
              Full name
            </label>
            <input
              id="fullName"
              name="fullName"
              required
              className="rounded-xl border border-default px-3.5 py-2.5 text-heading outline-none focus:border-accent"
            />
          </div>

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

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-semibold text-body">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="rounded-xl border border-default px-3.5 py-2.5 text-heading outline-none focus:border-accent"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="userType" className="text-sm font-semibold text-body">
              I am a
            </label>
            <select
              id="userType"
              name="userType"
              required
              className="rounded-xl border border-default px-3.5 py-2.5 text-heading outline-none focus:border-accent"
            >
              <option value="">Select one</option>
              <option value="Landlord">Landlord</option>
              <option value="Contractor">Contractor</option>
            </select>
          </div>

          <button
            type="submit"
            className="mt-2 rounded-xl bg-accent px-4 py-3 font-semibold text-white shadow-lg shadow-accent/25 hover:bg-accent-dark"
          >
            Create account
          </button>
        </form>
      </div>
    </main>
  );
}