// Works out the "where am I" trail for a page in the landlord or tenant portal from its address, so every nested page can show a Back
// button and breadcrumbs. It returns the PARENT pages only (the current page is added by the caller, using the page's own title).
// A page with nothing above it (the dashboard, or a top-level page such as Billing) gets an empty trail, so nothing is shown.

export interface Crumb {
  label: string;
  href: string;
}

const isId = (segment: string | undefined) => !!segment && /^\d+$/.test(segment);

// The crumbs one address segment adds. `previous` is the segment before it, `href` the address up to and including it.
// A segment that is not a page of its own (for example "units") adds nothing.
function crumbsFor(base: string, segment: string, previous: string | undefined, href: string): Crumb[] {
  if (base === "tenant") {
    if (segment === "documents") return [{ label: "Documents", href }];
    if (isId(segment) && previous === "documents") return [{ label: "Document", href }];
    return [];
  }

  if (segment === "properties") return [{ label: "Properties", href }];
  if (isId(segment) && previous === "properties") return [{ label: "Property", href }];
  if (isId(segment) && previous === "units") return [{ label: "Unit", href }];
  if (segment === "leases") return [{ label: "Leases", href }];
  // /landlord/tenancies has no list page of its own: a lease sits under Leases.
  if (segment === "tenancies") return [{ label: "Leases", href: "/landlord/leases" }];
  if (isId(segment) && previous === "tenancies") return [{ label: "Lease", href }];
  // /landlord/documents/<id> is a lease document: it also sits under Leases. Nested under a lease, "documents" is only a path segment.
  if (segment === "documents") return previous === undefined ? [{ label: "Leases", href: "/landlord/leases" }] : [];
  if (isId(segment) && previous === "documents") return [{ label: "Lease document", href }];
  if (segment === "renewals") return [{ label: "Renewals", href }];
  if (segment === "plan-proposals") return [{ label: "Plan proposals", href }];
  return [];
}

// "/landlord/properties/12/units/5/edit" -> Dashboard, Properties, Property, Unit.
export function breadcrumbTrail(pathname: string): Crumb[] {
  const parts = pathname.split("/").filter(Boolean);
  const base = parts[0];
  if (base !== "landlord" && base !== "tenant") return [];

  const rest = parts.slice(1);
  // A page at the top level of the portal has no parent to go back to.
  if (rest.length < 2) return [];

  const trail: Crumb[] = [{ label: "Dashboard", href: `/${base}` }];
  let href = `/${base}`;
  for (let index = 0; index < rest.length - 1; index += 1) {
    href += `/${rest[index]}`;
    for (const crumb of crumbsFor(base, rest[index], rest[index - 1], href)) {
      // Never list the same page twice in a row.
      if (trail[trail.length - 1].href !== crumb.href) trail.push(crumb);
    }
  }
  return trail;
}
