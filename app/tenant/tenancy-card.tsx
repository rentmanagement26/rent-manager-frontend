import { formatCalendarDate } from "@/lib/format-time";
import type { TenantTenancy } from "@/lib/types";

function formatAddress(property: TenantTenancy["property"]) {
  const street = [property.line1, property.line2].filter(Boolean).join(", ");
  return `${street}, ${property.city}, ${property.region} ${property.postalCode}`;
}

function formatFacts(unit: TenantTenancy["unit"]) {
  const facts: string[] = [];
  if (unit.bedrooms !== null) facts.push(`${unit.bedrooms} bed`);
  if (unit.bathrooms !== null) facts.push(`${unit.bathrooms} bath`);
  if (unit.squareFeet !== null) facts.push(`${unit.squareFeet.toLocaleString("en-CA")} sq ft`);
  return facts.join(" · ");
}

function Fact({ path, children }: { path: string; children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-2 text-sm text-body">
      <svg className="mt-0.5 h-4 w-4 shrink-0 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={path} />
      </svg>
      <span>{children}</span>
    </p>
  );
}

const PIN_PATH =
  "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z";
const HOME_PATH =
  "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6";
const CALENDAR_PATH = "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z";

export function CurrentHomeCard({ tenancy }: { tenancy: TenantTenancy }) {
  const { property, unit, landlord } = tenancy;
  const facts = formatFacts(unit);

  return (
    <div className="rounded-2xl border border-default bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold text-heading">{property.name}</h3>
          <p className="text-sm text-muted">{unit.label}</p>
        </div>
        <span className="shrink-0 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
          Active
        </span>
      </div>

      <div className="space-y-2">
        <Fact path={PIN_PATH}>{formatAddress(property)}</Fact>
        {facts && <Fact path={HOME_PATH}>{facts}</Fact>}
        <Fact path={CALENDAR_PATH}>Since {formatCalendarDate(tenancy.startDate)}</Fact>
      </div>

      {landlord && (
        <div className="mt-4 border-t border-default pt-4">
          <p className="text-xs text-muted">Your landlord</p>
          <p className="mt-1 text-sm font-medium text-heading">{landlord.name}</p>
          {landlord.businessName && <p className="text-sm text-muted">{landlord.businessName}</p>}
          {landlord.email && (
            <a href={`mailto:${landlord.email}`} className="text-sm text-accent hover:text-accent-dark">
              {landlord.email}
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export function PastHomeRow({ tenancy }: { tenancy: TenantTenancy }) {
  const { property, unit } = tenancy;
  const period = tenancy.endDate
    ? `${formatCalendarDate(tenancy.startDate)} to ${formatCalendarDate(tenancy.endDate)}`
    : `Since ${formatCalendarDate(tenancy.startDate)}`;

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-default bg-white px-5 py-4 shadow-sm">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-heading">{property.name}</p>
        <p className="truncate text-sm text-muted">
          {unit.label} · {period}
        </p>
      </div>
      <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">Ended</span>
    </div>
  );
}
