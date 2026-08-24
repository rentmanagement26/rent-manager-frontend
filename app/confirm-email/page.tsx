import Link from "next/link";
import { extractErrorMessage } from "@/lib/api-error";

export default async function ConfirmEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ userId?: string; token?: string }>;
}) {
  const { userId, token } = await searchParams;

  if (!userId || !token) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center p-8 text-center">
        <p className="rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">
          Invalid confirmation link.
        </p>
      </main>
    );
  }

  const response = await fetch(`${process.env.BACKEND_API_URL}/api/auth/confirm-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ UserId: userId, Token: token }),
  });

  if (!response.ok) {
    const message = await extractErrorMessage(response);
    return (
      <main className="flex flex-1 flex-col items-center justify-center p-8 text-center">
        <h1 className="mb-4 font-head text-2xl font-bold text-heading">Confirmation failed</h1>
        <p className="rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">
          {message}
        </p>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center p-8 text-center">
      <h1 className="mb-4 font-head text-2xl font-bold text-heading">Email confirmed</h1>
      <p className="mb-6 text-muted">Your account is verified. You can log in now.</p>
      <Link
        href="/login"
        className="rounded-xl bg-accent px-5 py-2.5 font-semibold text-white shadow-lg shadow-accent/25 hover:bg-accent-dark"
      >
        Go to login
      </Link>
    </main>
  );
}