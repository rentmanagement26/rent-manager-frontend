import Link from "next/link";
import { loginAction } from "@/app/login/actions";
import Image from "next/image";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; registered?: string }>;
}) {
  const { error, registered } = await searchParams;

  return (
    <main className="flex flex-1 flex-col md:flex-row">
      <div className="relative flex flex-col justify-between gap-6 overflow-hidden bg-linear-to-br from-accent to-accent-dark p-8 text-white md:w-[420px] md:flex-shrink-0 md:gap-14 md:p-14">
        <div className="pointer-events-none absolute -right-20 -top-40 h-72 w-72 rounded-full border border-white/15" />
        <Link href="/" className="flex items-center">
          <Image src="/logo.png" alt="DomusPRO" width={99} height={28} priority />
        </Link>
        <h1 className="max-w-xs font-head text-2xl font-extrabold leading-tight md:text-3xl">
          Manage your rentals without the chaos.
        </h1>
        <ul className="hidden flex-col gap-3 text-sm text-white/90 md:flex">
          <li>Property &amp; unit management</li>
          <li>Tenant portal</li>
          <li>Digital leases</li>
          <li>Online rent payments</li>
        </ul>
      </div>

      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <h2 className="mb-2 font-head text-2xl font-bold text-heading">Welcome back</h2>
          <p className="mb-6 text-sm text-muted">
            Log in to manage your properties, tenants, and leases.
          </p>

          {registered && (
            <p className="mb-4 rounded-lg bg-green-50 px-3 py-2.5 text-sm font-medium text-green-700">
              Registration successful. Please verify your email and log in again.
            </p>
          )}

          {error && (
            <p className="mb-4 rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">
              {error}
            </p>
          )}

          <form action={loginAction} className="flex flex-col gap-4">
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

            <button
              type="submit"
              className="mt-2 rounded-xl bg-accent px-4 py-3 font-semibold text-white shadow-lg shadow-accent/25 hover:bg-accent-dark"
            >
              Log in
            </button>

            <Link href="/register" className="text-center text-sm text-muted">
              Don&apos;t have an account? Sign up
            </Link>
          </form>
        </div>
      </div>
    </main>
  );
}