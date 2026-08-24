import Link from "next/link";
import { loginAction } from "@/app/login/actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; registered?: string }>;
}) {
  const { error, registered } = await searchParams;

  return (
    <main className="flex flex-1 flex-col items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <h1 className="mb-6 text-2xl font-bold">Log in</h1>

        {registered && (
          <p className="mb-4 text-sm text-green-600">
            Registration successful. Please verify your email and log in again.
          </p>
        )}

        {error && (
          <p className="mb-4 text-sm text-red-600">{error}</p>
        )}

        <form action={loginAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="rounded border border-gray-300 px-3 py-2"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="rounded border border-gray-300 px-3 py-2"
            />
          </div>

          <button type="submit" className="mt-2 rounded bg-black px-4 py-2 text-white">
            Log in
          </button>

          <Link href="/register" className="text-center text-sm text-gray-500">
            Don&apos;t have an account? Sign up
          </Link>
        </form>
      </div>
    </main>
  );
}