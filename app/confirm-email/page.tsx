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
        <p className="text-red-600">Invalid confirmation link.</p>
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
        <h1 className="mb-4 text-2xl font-bold">Confirmation failed</h1>
        <p className="text-red-600">{message}</p>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center p-8 text-center">
      <h1 className="mb-4 text-2xl font-bold">Email confirmed</h1>
      <p className="mb-4 text-gray-600">Your account is verified. You can log in now.</p>
      <Link href="/login" className="rounded bg-black px-4 py-2 text-white">
        Go to login
      </Link>
    </main>
  );
}