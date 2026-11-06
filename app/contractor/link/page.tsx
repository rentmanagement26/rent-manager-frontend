// The page a contractor without an account opens from the email link (/contractor/link?token=...): one job or one quote, no list, no sign-in.
// Anything they do here is shown to the landlord as "via link". The secret stays in the address: it is not stored, logged or sent anywhere else.
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ContractorJobView } from "@/components/contractor-job-view";
import { ContractorQuoteView } from "@/components/contractor-quote-view";
import SiteFooter from "@/components/site-footer";
import {
  linkDeclineQuoteAction,
  linkFileUrlAction,
  linkRegisterFileAction,
  linkRemoveFileAction,
  linkSubmitQuoteAction,
  linkUpdateAction,
} from "@/lib/contractor-portal-actions";
import { getLink } from "@/lib/contractor-portal-api";
import type { LinkPage } from "@/lib/contractor-portal-types";
import { MaintenanceError } from "@/lib/maintenance-call";

// The address holds a secret: keep it out of search engines and out of the Referer header.
export const metadata: Metadata = { title: "Your job", robots: { index: false, follow: false }, referrer: "no-referrer" };

// A bare page frame for the no-account link: the logo, the content, and the footer. No menu: there is nothing else to open.
function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <header className="border-b border-default bg-white">
        <div className="mx-auto flex max-w-6xl items-center px-4 py-3 sm:px-8">
          <Link href="/" className="flex items-center">
            <Image src="/domuspro-logo.png" alt="DomusPRO" width={150} height={50} priority className="h-auto w-auto" />
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-8">{children}</main>
      <SiteFooter />
    </div>
  );
}

// A friendly end of the road: the link is expired or not valid. It never says why a link is not valid, and offers no retry.
function Message({ title, text }: { title: string; text: string }) {
  return (
    <Frame>
      <div className="mx-auto mt-10 max-w-lg rounded-2xl border border-default bg-white p-8 text-center shadow-sm">
        <h1 className="font-head text-2xl font-bold text-heading">{title}</h1>
        <p className="mt-2 text-sm text-muted">{text}</p>
      </div>
    </Frame>
  );
}

export default async function ContractorLinkPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  if (!token) return <Message title="This link is not valid" text="Open the link from your email again." />;

  let page: LinkPage;
  try {
    page = await getLink(token);
  } catch (err) {
    if (err instanceof MaintenanceError && err.status === 410) return <Message title="This link has expired" text={err.message} />;
    if (err instanceof MaintenanceError && err.status === 404) return <Message title="This link is not valid" text="It may have been replaced by a newer email, or cancelled. Ask your landlord to send you a new link." />;
    return <Message title="Something went wrong" text="We could not open this link. Try again in a moment." />;
  }

  return (
    <Frame>
      <p className="mb-5 max-w-6xl rounded-2xl bg-brand-green-tint px-4 py-3 text-sm text-brand-green-dark">
        You opened this from the link in your email. No account needed. Everything you do here is shown to the landlord as &ldquo;via link&rdquo;.
      </p>

      {page.kind === "job" && page.job && (
        <ContractorJobView
          job={page.job}
          onUpdate={linkUpdateAction.bind(null, token)}
          files={{
            getUrl: linkFileUrlAction.bind(null, token),
            register: linkRegisterFileAction.bind(null, token),
            remove: linkRemoveFileAction.bind(null, token),
          }}
        />
      )}
      {page.kind === "quote" && page.quote && (
        <ContractorQuoteView
          quote={page.quote}
          onSubmit={linkSubmitQuoteAction.bind(null, token)}
          onDecline={linkDeclineQuoteAction.bind(null, token)}
          files={{
            getUrl: linkFileUrlAction.bind(null, token),
            register: linkRegisterFileAction.bind(null, token),
            remove: linkRemoveFileAction.bind(null, token),
          }}
        />
      )}
    </Frame>
  );
}
