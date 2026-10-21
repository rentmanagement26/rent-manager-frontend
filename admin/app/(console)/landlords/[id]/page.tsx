import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChangePlanButton } from "@/components/console/change-plan";
import { LandlordAccount } from "@/components/console/landlord-account";
import { OverridesManager } from "@/components/console/overrides-manager";
import { ProposalStatus } from "@/components/console/proposal-status";
import { ProposalWatcher } from "@/components/console/proposal-watcher";
import { Notice, Pill, cardClass } from "@/components/console/ui";
import { requireAdmin } from "@/lib/auth-guard";
import { getCatalog } from "@/lib/catalog-api";
import { formatPrice, formatWhen, initials } from "@/lib/format";
import { getOverrides } from "@/lib/override-api";
import { getPermissions, PERMISSIONS } from "@/lib/permissions";
import { getAwaitingProposals } from "@/lib/proposal-api";
import { getLandlordHistory, getLandlordSubscription, getPackages } from "@/lib/subscription-api";

export const metadata: Metadata = { title: "Landlord" };

// Landlord detail page: /landlords/<landlordProfileId>
//
// This lives in the ADMIN app only. It is separate from the landlord and tenant portals: it has its own
// login, its own session, and only talks to the backend's /api/v1/admin/... endpoints.
//
// It shows four things about one landlord:
//   1. who they are (header) + the "Change plan" button
//   2. their current plan and how much of each limit they have used
//   3. overrides (extra allowances support gave them on top of the plan)
//   4. the history of their plan changes
export default async function LandlordDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Only signed-in admins get past this line; anyone else is sent to the login page.
  const session = await requireAdmin();

  // The id comes from the URL (/landlords/42). Reject anything that isn't a positive whole number.
  const landlordProfileId = Number((await params).id);
  if (!Number.isInteger(landlordProfileId) || landlordProfileId <= 0) notFound();

  // Load everything at once instead of one after another, so the page opens faster.
  const [detail, history, packages, overrideList, catalog, { can }] = await Promise.all([
    getLandlordSubscription(session.backendToken, landlordProfileId),
    getLandlordHistory(session.backendToken, landlordProfileId),
    getPackages(session.backendToken), // the plan catalog, needed by the "Change plan" popup
    getOverrides(session.backendToken, landlordProfileId), // every override, including expired and removed ones
    getCatalog(session.backendToken), // the limit and feature lists for the "Add override" popup
    getPermissions(session), // what this admin may do, to decide which buttons to show
  ]);

  // "expired" means the admin's login timed out, so send them to sign in again.
  if (detail.status === "expired" || history.status === "expired" || packages.status === "expired" || overrideList.status === "expired") {
    redirect("/session-expired");
  }

  // Link back to the list, shown on every version of the page below.
  const backLink = (
    <Link href="/landlords" className="flex items-center gap-1.5 text-[13px] text-c-act2 hover:underline">
      <ArrowLeft size={14} /> All landlords
    </Link>
  );

  // If the main data didn't load (no permission, landlord not found, server problem), show a message
  // instead of crashing.
  if (detail.status !== "ok") {
    return (
      <div className="flex max-w-5xl flex-col gap-5">
        {backLink}
        <Notice>
          {detail.status === "forbidden"
            ? "Your role doesn't have access to landlords."
            : "Couldn't load this landlord. They may not exist, or try refreshing."}
        </Notice>
      </div>
    );
  }

  const { landlord, subscription } = detail.data;

  // Business name is the main title when there is one; the person's own name goes underneath.
  const displayName = landlord.businessName || landlord.name;

  // Buttons follow the admin's real permissions. (The backend enforces them too.)
  const canChangePlan = can(PERMISSIONS.subscriptionsChange) && packages.status === "ok";
  // "Add override" needs overrides.grant plus the catalog for its lists; "Remove" needs overrides.revoke.
  const overrideCatalog = can(PERMISSIONS.overridesGrant) && catalog.status === "ok" ? catalog.data : null;
  const canRevokeOverride = can(PERMISSIONS.overridesRevoke);

  // Is a plan proposal to this landlord still waiting for their answer? Looked up by email, so the call stays small.
  const awaitingResult = await getAwaitingProposals(session.backendToken, landlord.email ?? undefined);
  if (awaitingResult.status === "expired") redirect("/session-expired");
  const awaiting = awaitingResult.status === "ok" ? awaitingResult.data.filter((p) => p.landlordProfileId === landlord.landlordProfileId) : [];

  return (
    <div className="flex max-w-5xl flex-col gap-5">
      {backLink}

      {/* 1. Header: avatar, name, email, and the Change plan button */}
      <section className={`${cardClass} animate-up flex flex-wrap items-center gap-4`}>
        <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-c-aci text-sm font-medium text-c-act2">
          {initials(landlord.name)}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="flex items-center gap-2 text-2xl font-medium tracking-tight">
            <span className="truncate">{displayName}</span>
            {/* Only shown when the account is switched off */}
            {landlord.isActive === false && <Pill className="bg-c-bad text-c-badt">Deactivated</Pill>}
          </h1>
          <p className="truncate text-sm text-c-tx2">
            {landlord.businessName ? `${landlord.name} · ` : ""}
            {landlord.email ?? "No email"}
          </p>
        </div>
        {awaiting.length > 0 && <ProposalStatus changeId={awaiting[0].changeId} canWithdraw={canChangePlan} />}
        {canChangePlan && packages.status === "ok" && awaiting.length === 0 && (
          // Same popup the list uses. After sending it refreshes this page by itself.
          <ChangePlanButton landlordProfileId={landlord.landlordProfileId} landlordName={displayName} packages={packages.data} />
        )}
        <ProposalWatcher awaiting={awaiting} search={landlord.email ?? undefined} />
      </section>

      {/* Account controls (switch the account on/off, reset two-factor). SuperAdmin only; the backend enforces it too. */}
      {session.role === "SuperAdmin" && (
        <LandlordAccount
          landlordProfileId={landlord.landlordProfileId}
          userId={landlord.userId}
          name={displayName}
          isActive={landlord.isActive}
        />
      )}

      {/* 2. Current plan, with usage against each limit */}
      <section className={`${cardClass} animate-up`} style={{ animationDelay: "0.06s" }}>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-medium">Current plan</h2>
          {subscription.hasPlan ? (
            <>
              <Pill className="bg-c-sf2 text-c-tx">{subscription.packageName}</Pill>
              {/* Green when Active, amber for anything else */}
              {subscription.status && (
                <Pill className={subscription.status === "Active" ? "bg-c-ok text-c-okt" : "bg-c-wr text-c-wrt"}>
                  {subscription.status}
                </Pill>
              )}
              {subscription.monthlyPrice != null && (
                <span className="text-sm text-c-tx2">{formatPrice(subscription.monthlyPrice)} / month</span>
              )}
            </>
          ) : (
            <Pill className="bg-c-sf2 text-c-tx3">No plan</Pill>
          )}
        </div>

        {subscription.startedAt && <p className="mb-4 text-xs text-c-tx3">Started {formatWhen(subscription.startedAt)}</p>}

        {/* One tile per limit, e.g. "Properties: 3 of 5". The limit already includes any override. */}
        {subscription.limits.length > 0 && (
          <ul className="grid gap-3 sm:grid-cols-2">
            {subscription.limits.map((limit) => (
              <li key={limit.key} className="rounded-xl bg-c-sf2 px-4 py-3">
                <div className="text-xs text-c-tx2">{limit.displayName}</div>
                <div className="text-lg font-medium">
                  {limit.used} <span className="text-sm font-normal text-c-tx3">of {limit.limit}</span>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Features the plan includes, as small tags */}
        {subscription.features.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {subscription.features.map((feature) => (
              <Pill key={feature.key} className="bg-c-sf2 text-c-tx">
                {feature.displayName}
              </Pill>
            ))}
          </div>
        )}
      </section>

      {/* 3. Overrides: extra allowances and feature switches given on top of the plan */}
      {overrideList.status === "ok" ? (
        <OverridesManager
          landlordProfileId={landlord.landlordProfileId}
          landlordName={displayName}
          overrides={overrideList.data}
          catalog={overrideCatalog}
          canRevoke={canRevokeOverride}
        />
      ) : (
        <section className={`${cardClass} animate-up`} style={{ animationDelay: "0.12s" }}>
          <h2 className="mb-3 text-lg font-medium">Overrides</h2>
          <Notice>
            {overrideList.status === "forbidden"
              ? "Your role can't see overrides."
              : "Couldn't load overrides right now. Refresh to try again."}
          </Notice>
        </section>
      )}

      {/* 4. Plan history, newest first */}
      <section className={`${cardClass} animate-up`} style={{ animationDelay: "0.18s" }}>
        <h2 className="mb-3 text-lg font-medium">Plan history</h2>
        {history.status !== "ok" ? (
          <Notice>Couldn&apos;t load the history right now.</Notice>
        ) : history.data.items.length === 0 ? (
          <Notice>No plan changes yet.</Notice>
        ) : (
          <ul className="flex flex-col divide-y divide-c-bd">
            {history.data.items.map((entry) => (
              <li key={entry.id} className="py-2.5 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">
                    {entry.eventType}
                    {/* "Starter → Pro" when a plan name is known */}
                    {(entry.fromPackage || entry.toPackage) && (
                      <span className="font-normal text-c-tx2">
                        {" "}
                        · {entry.fromPackage ?? "none"} → {entry.toPackage ?? "none"}
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-c-tx3">{formatWhen(entry.occurredAt)}</span>
                </div>
                {/* The reason and note the admin gave, when there are any */}
                {(entry.reasonCode || entry.note) && (
                  <p className="mt-0.5 text-xs text-c-tx2">
                    {entry.reasonCode}
                    {entry.reasonCode && entry.note ? " — " : ""}
                    {entry.note}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
