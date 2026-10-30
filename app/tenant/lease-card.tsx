// "My lease" on the tenant home: the agreed rent, due day, term, deposit, utilities and the other tenants' names.
// Read only. Rent comes from the lease the landlord agreed, not from the unit's asking price.
import { formatCalendarDate } from "@/lib/format-time";
import { CHARGE_FREQUENCIES, formatMoney, labelFor, monthlyTotal, ordinal } from "@/lib/lease-format";
import { utilityList } from "@/components/lease-terms";
import type { TenancyDetails } from "@/lib/tenancy-types";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-t border-default py-2.5 text-sm first:border-t-0">
      <span className="text-muted">{label}</span>
      <span className="text-right font-medium text-heading">{children}</span>
    </div>
  );
}

export function LeaseCard({ lease, homeName }: { lease: TenancyDetails; homeName: string }) {
  const others = lease.tenants.filter((tenant) => !tenant.leftAt).map((tenant) => tenant.name).filter(Boolean);
  const term =
    lease.termType === "Fixed"
      ? `Fixed, ${formatCalendarDate(lease.startDate)} to ${lease.endDate ? formatCalendarDate(lease.endDate) : "no end date"}`
      : `Month to month since ${formatCalendarDate(lease.startDate)}`;

  return (
    <section className="rounded-2xl border border-default bg-white p-5 shadow-sm sm:p-6">
      <h3 className="mb-3 text-sm font-semibold text-heading">My lease · {homeName}</h3>
      <Row label="Rent">
        {formatMoney(lease.monthlyRent)} / month{lease.rentDueDay ? `, due on the ${ordinal(lease.rentDueDay)}` : ""}
      </Row>
      <Row label="Term">{term}</Row>
      <Row label="Security deposit">{formatMoney(lease.securityDeposit)}</Row>
      {lease.petDeposit ? <Row label="Pet deposit">{formatMoney(lease.petDeposit)}</Row> : null}
      <Row label="Utilities you pay">{utilityList(lease, "tenant_pays")}</Row>
      <Row label="Included in your rent">{utilityList(lease, "included_in_rent")}</Row>
      {lease.charges.length > 0 && (
        <Row label="Extra charges">
          {lease.charges.map((charge) => `${charge.description || charge.type} ${formatMoney(charge.amount)} ${labelFor(charge.frequency, CHARGE_FREQUENCIES).toLowerCase()}`).join(", ")}
        </Row>
      )}
      {lease.charges.length > 0 && lease.monthlyRent !== null && <Row label="Total each month">{formatMoney(monthlyTotal(lease.monthlyRent, lease.charges))}</Row>}
      {others.length > 1 && <Row label="Tenants on this lease">{others.join(", ")}</Row>}
    </section>
  );
}
