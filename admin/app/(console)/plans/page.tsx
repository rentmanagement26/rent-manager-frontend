import { Check } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AddPlanButton, PlanCardActions } from "@/components/console/plan-editor";
import { PlanVersionsButton } from "@/components/console/plan-versions";
import { Notice, Pill, cardClass } from "@/components/console/ui";
import { getCatalog } from "@/lib/catalog-api";
import { getPermissions, PERMISSIONS } from "@/lib/permissions";
import { requireAdmin } from "@/lib/auth-guard";
import { formatPrice } from "@/lib/format";
import { getPackages } from "@/lib/subscription-api";
import type { AdminPackage, Catalog } from "@/lib/types";

export const metadata: Metadata = { title: "Plans" };

// One plan: name, price, what it limits, and what it includes. `catalog` is set only when this admin can edit.
function PlanCard({ plan, catalog }: { plan: AdminPackage; catalog: Catalog | null }) {
  return (
    <article className={`${cardClass} flex flex-col gap-4`}>
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-lg font-medium">{plan.name}</h2>
        <div className="flex flex-wrap justify-end gap-1.5">
          {plan.isDefault && <Pill className="bg-c-aci text-c-act2">Default</Pill>}
          {!plan.isActive && <Pill className="bg-c-wr text-c-wrt">Inactive</Pill>}
        </div>
      </div>

      <div>
        <span className="text-3xl font-medium tracking-tight">{formatPrice(plan.monthlyPrice)}</span>
        <span className="text-c-tx2"> / month</span>
      </div>

      {/* Limits: the numbers a landlord can't go over on this plan. */}
      <dl className="flex flex-col gap-2 border-t border-c-bd pt-4 text-[13px]">
        {plan.limits.map((limit) => (
          <div key={limit.key} className="flex justify-between">
            <dt className="text-c-tx2">{limit.displayName}</dt>
            <dd className="font-medium">{limit.value}</dd>
          </div>
        ))}
        {plan.limits.length === 0 && <p className="text-c-tx3">No limits set.</p>}
      </dl>

      {/* Features: what the plan switches on. */}
      <ul className="flex flex-col gap-1.5 border-t border-c-bd pt-4 text-[13px]">
        {plan.features.map((feature) => (
          <li key={feature.key} className="flex items-center gap-2">
            <Check size={15} className="shrink-0 text-c-okt" />
            {feature.displayName}
          </li>
        ))}
        {plan.features.length === 0 && <li className="text-c-tx3">No extra features.</li>}
      </ul>

      <div className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-c-tx3">
        <span>Version {plan.version}</span>
        {plan.landlords != null && (
          <span>
            · {plan.landlords} {plan.landlords === 1 ? "landlord" : "landlords"}
          </span>
        )}
        {!!plan.landlordsOnOlderVersions && (
          <Pill className="bg-c-wr text-c-wrt">{plan.landlordsOnOlderVersions} on an older version</Pill>
        )}
      </div>
      <PlanVersionsButton packageId={plan.packageId} planName={plan.name} canManage={!!catalog} />
      {catalog && <PlanCardActions plan={plan} catalog={catalog} />}
    </article>
  );
}

export default async function PlansPage() {
  const session = await requireAdmin();
  const [packages, catalog, { can }] = await Promise.all([
    getPackages(session.backendToken),
    getCatalog(session.backendToken),
    getPermissions(session),
  ]);
  // Editing needs the catalog (for the limit and feature lists) and the packages.manage permission.
  const editCatalog = can(PERMISSIONS.packagesManage) && catalog.status === "ok" ? catalog.data : null;

  if (packages.status === "expired") {
    redirect("/session-expired");
  }

  return (
    <div className="flex max-w-5xl flex-col gap-5">
      <div className="animate-up">
        <h1 className="text-2xl font-medium tracking-tight">Plans</h1>
        <p className="mt-1 text-c-tx2">What each plan costs and includes. To move a landlord to a plan, use Landlords.</p>
        {editCatalog && (
          <div className="mt-4">
            <AddPlanButton catalog={editCatalog} />
          </div>
        )}
      </div>

      <div className="animate-up flex flex-col gap-5" style={{ animationDelay: "0.06s" }}>
        {packages.status === "ok" ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[...packages.data]
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((plan) => (
                  <PlanCard key={plan.packageId} plan={plan} catalog={editCatalog} />
                ))}
            </div>
            <Notice>
              A new version changes the price, limits and features of a plan and keeps the old version in the history (see Versions on
              each plan). Landlords already on the plan keep their version. Features and limits come from the Catalog.
            </Notice>
          </>
        ) : (
          <section className={cardClass}>
            <Notice>
              {packages.status === "forbidden"
                ? "Your role doesn't have access to plans."
                : "Couldn't load plans right now. Refresh to try again."}
            </Notice>
          </section>
        )}
      </div>
    </div>
  );
}
