import Link from "next/link";
import { getSession } from "@/lib/get-session";
import { getTenantInvitePreview } from "@/lib/tenant-invite-api";
import { logoutAction } from "@/app/actions";
import { registerTenantAction, acceptTenantInviteAction } from "./actions";

export default async function RegisterTenantPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string; accepted?: string }>;
}) {
  const { token, error, accepted } = await searchParams;

  if (!token) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center p-8 text-center">
        <p className="rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">
          Invalid invite link.
        </p>
      </main>
    );
  }

  if (accepted === "1") {
    return (
      <main className="flex flex-1 flex-col items-center justify-center p-8 text-center">
        <h1 className="mb-4 font-head text-2xl font-bold text-heading">You&apos;re in</h1>
        <p className="mb-6 text-muted">This unit has been added to your account.</p>
        <Link
          href="/tenant"
          className="rounded-xl bg-accent px-5 py-2.5 font-semibold text-white shadow-lg shadow-accent/25 hover:bg-accent-dark"
        >
          Go to your portal
        </Link>
      </main>
    );
  }

  let preview;
  try {
    preview = await getTenantInvitePreview(token);
  } catch {
    return (
      <main className="flex flex-1 flex-col items-center justify-center p-8 text-center">
        <p className="rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">
          Invalid invite link.
        </p>
      </main>
    );
  }

  if (preview.isExpired) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center p-8 text-center">
        <p className="rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">
          This invite has expired.
        </p>
      </main>
    );
  }

  if (preview.isUsed) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center p-8 text-center">
        <p className="rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">
          This invite has already been used.
        </p>
      </main>
    );
  }

  const session = await getSession();

  const introCard = (
    <div className="mb-6 rounded-lg bg-subtle px-4 py-3 text-sm text-body">
      <p>
        <span className="font-semibold">{preview.landlordName}</span> invited you to{" "}
        <span className="font-semibold">{preview.unitLabel}</span> at {preview.propertyName}, {preview.addressLine}.
      </p>
    </div>
  );

  if (session && session.email.toLowerCase() === preview.email.toLowerCase()) {
    return (
      <main className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-sm text-center">
          <h2 className="mb-2 font-head text-2xl font-bold text-heading">Accept your invite</h2>
          {introCard}
          {error && (
            <p className="mb-4 rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">
              {error}
            </p>
          )}
          <form action={acceptTenantInviteAction}>
            <input type="hidden" name="token" value={token} />
            <button
              type="submit"
              className="w-full rounded-xl bg-accent px-4 py-3 font-semibold text-white shadow-lg shadow-accent/25 hover:bg-accent-dark"
            >
              Accept invite
            </button>
          </form>
        </div>
      </main>
    );
  }

  if (session && session.email.toLowerCase() !== preview.email.toLowerCase()) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center p-8 text-center">
        {introCard}
        <p className="mb-6 text-muted">
          This invite was sent to {preview.email}, but you&apos;re logged in as {session.email}.
          Log out and sign in with the invited email to accept it.
        </p>
        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded-xl bg-accent px-5 py-2.5 font-semibold text-white shadow-lg shadow-accent/25 hover:bg-accent-dark"
          >
            Log out
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <h2 className="mb-2 font-head text-2xl font-bold text-heading">Create your account</h2>
        {introCard}

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">
            {error}
          </p>
        )}

        <form action={registerTenantAction} className="flex flex-col gap-4">
          <input type="hidden" name="token" value={token} />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="firstName" className="text-sm font-semibold text-body">First name</label>
            <input
              id="firstName"
              name="firstName"
              required
              className="rounded-xl border border-default px-3.5 py-2.5 text-heading outline-none focus:border-accent"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="middleName" className="text-sm font-semibold text-body">Middle name (optional)</label>
            <input
              id="middleName"
              name="middleName"
              className="rounded-xl border border-default px-3.5 py-2.5 text-heading outline-none focus:border-accent"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="lastName" className="text-sm font-semibold text-body">Last name</label>
            <input
              id="lastName"
              name="lastName"
              required
              className="rounded-xl border border-default px-3.5 py-2.5 text-heading outline-none focus:border-accent"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-semibold text-body">Password</label>
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
            Create account
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link
            href={`/login?redirect=${encodeURIComponent(`/register/tenant?token=${token}`)}`}
            className="text-accent hover:text-accent-dark"
          >
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}