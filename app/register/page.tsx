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
        <h1 className="mb-4 text-2xl font-bold">Create an account</h1>
        <Link href="/login" className="mb-3 block text-sm text-gray-500">
          Already have an account? Log in
        </Link>
        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        <form action={registerAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="fullName" className="text-sm font-medium">
              Full name
            </label>
            <input id="fullName" name="fullName" required className="rounded border border-gray-300 px-3 py-2" />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input id="email" name="email" type="email" required className="rounded border border-gray-300 px-3 py-2" />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <input id="password" name="password" type="password" required className="rounded border border-gray-300 px-3 py-2" />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="userType" className="text-sm font-medium">
              I am a
            </label>
            <select id="userType" name="userType" required className="rounded border border-gray-300 px-3 py-2">
              <option value="">Select one</option>
              <option value="Landlord">Landlord</option>
              <option value="Contractor">Contractor</option>
            </select>
          </div>

          <button type="submit" className="mt-2 rounded bg-black px-4 py-2 text-white">
            Create account
          </button>
        </form>
      </div>
    </main>
  );
}   