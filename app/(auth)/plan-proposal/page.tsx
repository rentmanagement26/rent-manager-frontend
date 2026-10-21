// The page the Accept / Decline buttons in a plan proposal email open. No sign-in: the secret in the link (?token=) is
// the proof. Opening it only reads the proposal; the landlord must press Accept or Decline to answer.
import type { Metadata } from "next";
import { AuthSplitLayout } from "@/components/auth-split-layout";
import { LinkMessage, PlanProposalLinkCard } from "@/components/plan-proposal-link-card";
import { getProposalByLink, looksLikeToken } from "@/lib/proposal-link-api";

// The link is private, so keep it out of search engines and out of the Referer header sent to other sites.
export const metadata: Metadata = {
  title: "Plan proposal",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function PlanProposalLinkPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; action?: string }>;
}) {
  const { token, action } = await searchParams;

  const inactive = (
    <LinkMessage title="This link is no longer active" text="It may have been answered, withdrawn or replaced by a newer email." />
  );

  if (!looksLikeToken(token)) return <AuthSplitLayout>{inactive}</AuthSplitLayout>;

  const result = await getProposalByLink(token);

  if (result.status === "error") {
    return (
      <AuthSplitLayout>
        <LinkMessage title="We couldn't load this proposal" text="Please refresh the page in a moment. Your plan has not changed." />
      </AuthSplitLayout>
    );
  }
  if (result.status === "invalid" || result.data.state === "answered") {
    return <AuthSplitLayout>{inactive}</AuthSplitLayout>;
  }
  if (result.data.state === "expired" || !result.data.current || !result.data.target || !result.data.changes) {
    return (
      <AuthSplitLayout>
        <LinkMessage title="This proposal has expired" text="Contact support if you still want to change your plan." />
      </AuthSplitLayout>
    );
  }

  return (
    <AuthSplitLayout>
      <PlanProposalLinkCard
        token={token}
        highlight={action === "accept" || action === "decline" ? action : null}
        current={result.data.current}
        target={result.data.target}
        changes={result.data.changes}
        message={result.data.message}
        expiresAt={result.data.expiresAt}
      />
    </AuthSplitLayout>
  );
}
