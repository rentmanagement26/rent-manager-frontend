import Link from "next/link";
import { redirect } from "next/navigation";
import { requireBackendToken } from "@/lib/auth-guard";
import { backendFetch } from "@/lib/api-client";
import { getMySubscription } from "@/lib/billing-api";
import { getActivity } from "@/lib/activity-api";
import { getTenantInviteStats } from "@/lib/tenant-invite-api";
import { listDocuments } from "@/lib/document-api";
import { listRenewals } from "@/lib/tenancy-api";
import { PageHeader } from "@/components/page-header";
import { PlanProposalBanner } from "@/components/plan-proposal-banner";
import {
  InvitesCard,
  LeaseActionsCard,
  OccupancyCard,
  RenewalsCard,
  PlanUsageCard,
  RecentActivityCard,
  RentComingSoonCard,
  StatTile,
} from "@/components/dashboard-cards";
import type { Property } from "@/lib/types";

// Runs a side lookup and gives null if it fails, so one broken card never takes the whole dashboard down.
async function tryLoad<T>(load: () => Promise<T>): Promise<T | null> {
  try {
    return await load();
  } catch {
    return null;
  }
}

export default async function AdminDashboardPage() {
  const session = await requireBackendToken(["Admin", "Landlord"]);
  const token = session.backendToken;

  const [response, subscription, inviteStats, activity, documents, renewals] = await Promise.all([
    backendFetch("/api/v1/properties/mine", token),
    tryLoad(() => getMySubscription(token)),
    tryLoad(() => getTenantInviteStats(token)),
    tryLoad(() => getActivity(token, {})),
    tryLoad(() => listDocuments(token)),
    tryLoad(() => listRenewals(token, 180)),
  ]);

  if (response.status === 401) {
    redirect("/session-expired");
  }

  const properties: Property[] = await response.json();
  const units = properties.flatMap((property) => property.units);
  const countUnits = (status: string) => units.filter((unit) => unit.status === status).length;
  const occupied = countUnits("Occupied");
  const available = countUnits("Vacant") + countUnits("Listed");
  // "Property, Unit" for each unit, for the renewals card.
  const unitNames = new Map(properties.flatMap((property) => property.units.map((unit) => [unit.id, `${property.name}, ${unit.label}`] as const)));
  const firstName = session.fullName?.split(" ")[0];

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Your properties, units and tenants at a glance." />

      {/* Shown only while support's plan proposal waits for the landlord's answer */}
      <PlanProposalBanner token={token} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-head text-2xl font-bold text-heading">Hello{firstName ? ` ${firstName}` : ""},</h2>
        <div className="flex gap-2">
          <Link href="/landlord/properties/new" className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark">
            + Add property
          </Link>
          <Link href="/landlord/tenants" className="rounded-full border border-default bg-white px-4 py-2 text-sm font-semibold text-heading hover:bg-subtle">
            Invite tenant
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatTile label="Properties" value={properties.length} note="in your portfolio" />
        <StatTile label="Units" value={units.length} note={`${occupied} occupied`} />
        <StatTile label="Occupancy" value={units.length > 0 ? `${Math.round((occupied / units.length) * 100)}%` : "0%"} note="of all units" />
        <StatTile label="Available" value={available} note={`${countUnits("UnderMaintenance")} under maintenance`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <OccupancyCard properties={properties} />
          <RentComingSoonCard />
        </div>
        <div className="space-y-6">
          {subscription?.hasPlan && <PlanUsageCard subscription={subscription} />}
          {documents && <LeaseActionsCard documents={documents} />}
          {renewals && <RenewalsCard rows={renewals} unitNames={unitNames} />}
          {inviteStats && <InvitesCard stats={inviteStats} />}
          {activity && <RecentActivityCard items={activity.items.slice(0, 5)} />}
        </div>
      </div>
    </div>
  );
}
