// One quote request for a contractor with an account. The quote body is shared with the no-account email link; here the calls are tied to the quote's id.
import { notFound, redirect } from "next/navigation";
import { ContractorQuoteView } from "@/components/contractor-quote-view";
import { SessionExpiredError } from "@/lib/api-error";
import { requireBackendToken } from "@/lib/auth-guard";
import {
  contractorFileUrlAction,
  contractorRegisterFileAction,
  contractorRemoveFileAction,
  declineQuoteAsContractorAction,
  submitQuoteAsContractorAction,
} from "@/lib/contractor-portal-actions";
import { getQuote } from "@/lib/contractor-portal-api";
import type { MyQuote } from "@/lib/contractor-portal-types";

export default async function ContractorQuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const session = await requireBackendToken(["Contractor"]);

  let quote: MyQuote | null;
  try {
    quote = await getQuote(session.backendToken, Number(id));
  } catch (err) {
    if (err instanceof SessionExpiredError) redirect("/session-expired");
    return <p className="rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">Couldn&apos;t load this quote request. Refresh to try again.</p>;
  }
  if (!quote) notFound();

  return (
    <ContractorQuoteView
      quote={quote}
      onSubmit={submitQuoteAsContractorAction.bind(null, quote.id)}
      onDecline={declineQuoteAsContractorAction.bind(null, quote.id)}
      jobHref={quote.jobId ? `/contractor/jobs/${quote.jobId}` : undefined}
      files={{
        getUrl: contractorFileUrlAction.bind(null, "quotes", quote.id),
        register: contractorRegisterFileAction.bind(null, "quotes", quote.id),
        remove: contractorRemoveFileAction.bind(null, "quotes", quote.id),
      }}
    />
  );
}
