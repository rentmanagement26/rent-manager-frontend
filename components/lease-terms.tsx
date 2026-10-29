// The agreed lease terms (rent, term, deposits, utilities, extra charges) as read-only cards.
// Used by the landlord's tenancy page and by the tenant's "My lease" card, so both see the same words.
import { formatCalendarDate } from "@/lib/format-time";
import { CHARGE_FREQUENCIES, CHARGE_TYPES, RESPONSIBILITY_OPTIONS, UTILITIES, formatMoney, labelFor, ordinal, toWire } from "@/lib/lease-format";
import type { TenancyDetails } from "@/lib/tenancy-types";

function Tile({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-2xl border border-default bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold text-muted">{label}</p>
      <p className="mt-1 font-head text-xl font-bold text-heading">{value}</p>
      {note && <p className="mt-0.5 text-xs text-muted">{note}</p>}
    </div>
  );
}

// Utility names for one answer, such as every utility the tenant pays.
function utilitiesWith(details: TenancyDetails, responsibility: string): string[] {
  return UTILITIES.filter((name) =>
    details.utilities.some((u) => toWire(u.utility) === name.toLowerCase() && toWire(u.responsibility) === responsibility)
  );
}

export function LeaseTerms({ details }: { details: TenancyDetails }) {
  const term =
    details.termType === "Fixed"
      ? `${formatCalendarDate(details.startDate)} to ${details.endDate ? formatCalendarDate(details.endDate) : "no end date"}`
      : `Since ${formatCalendarDate(details.startDate)}`;
  const extraDeposit = details.petDeposit ? `pet deposit ${formatMoney(details.petDeposit)}` : "no pet deposit";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Tile
          label="Monthly rent"
          value={formatMoney(details.monthlyRent)}
          note={details.rentDueDay ? `due on the ${ordinal(details.rentDueDay)}` : "due day not set"}
        />
        <Tile label="Term" value={details.termType === "Fixed" ? "Fixed" : "Month to month"} note={term} />
        <Tile label="Security deposit" value={formatMoney(details.securityDeposit)} note={extraDeposit} />
        <Tile
          label="Tenants"
          value={String(details.tenants.filter((t) => !t.leftAt).length)}
          note="on this lease now"
        />
      </div>

      <section className="rounded-2xl border border-default bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-heading">Utilities</h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {UTILITIES.map((name) => {
            const answer = details.utilities.find((u) => toWire(u.utility) === name.toLowerCase());
            return (
              <li key={name}>
                <p className="text-xs text-muted">{name}</p>
                <p className="text-sm font-medium text-heading">
                  {answer ? labelFor(answer.responsibility, RESPONSIBILITY_OPTIONS) : "Not applicable"}
                </p>
              </li>
            );
          })}
        </ul>

        {details.charges.length > 0 && (
          <ul className="mt-4 divide-y divide-default border-t border-default text-sm">
            {details.charges.map((charge) => (
              <li key={charge.id} className="flex justify-between py-2">
                <span className="text-heading">
                  {labelFor(charge.type, CHARGE_TYPES)}
                  {charge.description ? ` · ${charge.description}` : ""}
                </span>
                <span className="text-muted">
                  {formatMoney(charge.amount)} {labelFor(charge.frequency, CHARGE_FREQUENCIES).toLowerCase()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

// One-line summary for the tenant, such as "Electricity, Internet", or a dash when none apply.
export function utilityList(details: TenancyDetails, responsibility: string): string {
  const names = utilitiesWith(details, responsibility);
  return names.length > 0 ? names.join(", ") : "None";
}
