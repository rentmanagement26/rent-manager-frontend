import { PendingOverlay } from "@/components/pending-overlay";
import Link from "next/link";
import { getSession } from "@/lib/get-session";
import { getTenantInvitePreview } from "@/lib/tenant-invite-api";
import { logoutAction } from "@/app/actions";
import { loginAction } from "@/app/(auth)/login/actions";
import { AuthSplitLayout } from "@/components/auth-split-layout";
import { registerTenantAction, acceptTenantInviteAction } from "./actions";
import { InviteChoice } from "./invite-choice";
import { DeclineInviteButton } from "./decline-invite-button";

export default async function RegisterTenantPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string; accepted?: string; declined?: string; step?: string }>;
}) {
  const { token, error, accepted, declined, step } = await searchParams;

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

  if (declined === "1") {
    return (
      <main className="flex flex-1 flex-col items-center justify-center p-8 text-center">
        <h1 className="mb-4 font-head text-2xl font-bold text-heading">Invite declined</h1>
        <p className="text-muted">We&apos;ve let the landlord know. You can close this page.</p>
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
          <DeclineInviteButton token={token} />
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

    const backHref = `/register/tenant?token=${encodeURIComponent(token)}`;

  if (step !== "login" && step !== "register") {
    return (
      <AuthSplitLayout>
        <InviteChoice token={token} email={preview.email} introCard={introCard} />
        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">{error}</p>
        )}
        <DeclineInviteButton token={token} />
      </AuthSplitLayout>
    );
  }

  const backLink = (
    <Link href={backHref} className="mb-4 inline-block text-sm text-accent hover:text-accent-dark">
      ← Back
    </Link>
  );

  if (step === "login") {
    return (
      <AuthSplitLayout>
        {backLink}
        <h2 className="mb-2 font-head text-2xl font-bold text-heading">Log in to accept</h2>
        {introCard}

        <form action={loginAction} className="flex flex-col gap-4">
<PendingOverlay />
          <input type="hidden" name="redirect" value={backHref} />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-semibold text-body">Email</label>
            <input
              id="email"
              name="email"
              type="email"
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

          <Link href="/forgot-password" className="text-right text-sm text-accent hover:text-accent-dark">
            Forgot password?
          </Link>

          <button
            type="submit"
            className="mt-2 rounded-xl bg-accent px-4 py-3 font-semibold text-white shadow-lg shadow-accent/25 hover:bg-accent-dark"
          >
            Log in
          </button>
        </form>
      </AuthSplitLayout>
    );
  }

  return (
    <AuthSplitLayout>
      {backLink}
      <h2 className="mb-2 font-head text-2xl font-bold text-heading">Create your account</h2>
      {introCard}

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      <form action={registerTenantAction} className="flex flex-col gap-4">
<PendingOverlay />
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
    </AuthSplitLayout>
  );
}