// The page a contractor opens from a landlord's invitation email (/contractor/invite?token=...). It says who invited them and lets them create
// a contractor account, sign in, or (when already signed in as a contractor) accept. Needs no sign-in to look at. The token stays in the address.
import type { Metadata } from "next";
import Link from "next/link";
import { AcceptInvitationButton } from "@/components/accept-invitation-button";
import { AuthSplitLayout } from "@/components/auth-split-layout";
import { getInvitation } from "@/lib/contractor-portal-api";
import type { Invitation } from "@/lib/contractor-portal-types";
import { getSession } from "@/lib/get-session";

// The address holds a secret: keep it out of search engines and out of the Referer header.
export const metadata: Metadata = { title: "Contractor invitation", robots: { index: false, follow: false }, referrer: "no-referrer" };

const linkButton = "block w-full rounded-full px-6 py-2.5 text-center text-sm font-semibold";

export default async function ContractorInvitePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;

  let invitation: Invitation | null = null;
  let unavailable = false;
  if (token) {
    try {
      invitation = await getInvitation(token);
    } catch {
      unavailable = true;
    }
  }

  if (unavailable) {
    return (
      <AuthSplitLayout>
        <h2 className="mb-2 font-head text-2xl font-bold text-heading">Something went wrong</h2>
        <p className="text-sm text-muted">We could not check this invitation. Try again in a moment.</p>
      </AuthSplitLayout>
    );
  }

  if (!invitation) {
    return (
      <AuthSplitLayout>
        <h2 className="mb-2 font-head text-2xl font-bold text-heading">This invitation is not valid</h2>
        <p className="text-sm text-muted">It may have been used, replaced by a newer one, or never existed. Ask your landlord to send you a new invitation.</p>
      </AuthSplitLayout>
    );
  }

  if (invitation.state === "Expired") {
    return (
      <AuthSplitLayout>
        <h2 className="mb-2 font-head text-2xl font-bold text-heading">This invitation has expired</h2>
        <p className="text-sm text-muted">Ask {invitation.landlordName} to send you a new one.</p>
      </AuthSplitLayout>
    );
  }

  const session = await getSession();
  // Where signing in brings the person back to: this same page, token included.
  const comeBack = encodeURIComponent(`/contractor/invite?token=${encodeURIComponent(token!)}`);

  return (
    <AuthSplitLayout>
      <h2 className="mb-2 font-head text-2xl font-bold text-heading">{invitation.landlordName} invited you</h2>
      <p className="mb-5 text-sm text-muted">to receive jobs and quote requests in DomusPRO.</p>

      <dl className="mb-5 grid grid-cols-[110px_1fr] gap-x-3 gap-y-2 rounded-2xl border border-default bg-white p-4 text-sm shadow-sm">
        <dt className="text-muted">On their list</dt>
        <dd className="font-semibold text-heading">{invitation.contractorName}</dd>
        {invitation.email && (
          <>
            <dt className="text-muted">Sent to</dt>
            <dd className="font-semibold text-heading">{invitation.email}</dd>
          </>
        )}
      </dl>

      {session?.role === "Contractor" ? (
        <AcceptInvitationButton inviteToken={token!} landlordName={invitation.landlordName} />
      ) : session ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
          You are signed in with a {session.role.toLowerCase()} account. An invitation needs a contractor account: sign out and use a contractor account, or create one.
        </p>
      ) : (
        <div className="space-y-2.5">
          <p className="mb-3 text-sm text-muted">
            With an account you see every job and quote request from every landlord that invited you, in one place. Any email link they sent you stops working.
          </p>
          <Link href={`/login?redirect=${comeBack}`} className={`${linkButton} bg-accent text-white hover:bg-accent-dark`}>I have an account: sign in</Link>
          <Link href="/register" className={`${linkButton} border border-default bg-white text-heading hover:bg-subtle`}>Create my contractor account</Link>
          <p className="text-xs text-muted">After you create your account and confirm your email, open this invitation again from your email and sign in.</p>
        </div>
      )}
    </AuthSplitLayout>
  );
}
