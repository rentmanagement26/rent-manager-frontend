import { Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CustomerActions } from "@/components/console/customer-actions";
import { Notice, Pill, cardClass, inputClass, secondaryButtonClass } from "@/components/console/ui";
import { requireAdmin } from "@/lib/auth-guard";
import { getCustomers } from "@/lib/customer-api";
import { initials } from "@/lib/format";
import { getPermissions, PERMISSIONS } from "@/lib/permissions";
import type { CustomerListItem } from "@/lib/types";

export const metadata: Metadata = { title: "Customers" };

interface SearchParams {
  search?: string;
  role?: string;
  status?: string;
  sort?: string;
  direction?: string;
  page?: string;
}

const ROLE_TABS = [
  { label: "All", value: "" },
  { label: "Landlords", value: "Landlord" },
  { label: "Tenants", value: "Tenant" },
  { label: "Contractors", value: "Contractor" },
] as const;

// Colour of the role pill.
const ROLE_STYLE: Record<string, string> = {
  Landlord: "bg-c-aci text-c-act2",
  Tenant: "bg-c-pu text-c-put",
  Contractor: "bg-c-wr text-c-wrt",
};

// Keeps only the values the backend accepts, so a hand-edited URL can't send nonsense.
function pick<T extends string>(value: string | undefined, allowed: readonly T[]): T | undefined {
  return allowed.find((a) => a === value);
}

function CustomerRow({ customer, canManage }: { customer: CustomerListItem; canManage: boolean }) {
  const role = customer.roles[0] ?? "Customer";
  return (
    // Phone: stacked. Desktop: fixed columns so Role, Status and 2FA line up on every row.
    <li className="flex flex-col gap-3 rounded-2xl px-3 py-3 hover:bg-c-sf2 sm:grid sm:grid-cols-[minmax(0,1fr)_100px_110px_60px_110px] sm:items-center sm:gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-c-aci text-xs font-medium text-c-act2">
          {initials(customer.name)}
        </div>
        <Link href={`/customers/${customer.userId}`} className="min-w-0 hover:underline">
          <div className="truncate text-sm font-medium">{customer.name}</div>
          <div className="truncate text-xs text-c-tx2">
            {customer.company ? `${customer.company} · ` : ""}
            {customer.email ?? "No email"}
          </div>
        </Link>
      </div>

      <div>
        <Pill className={ROLE_STYLE[role] ?? "bg-c-sf2 text-c-tx"}>{role}</Pill>
      </div>
      <div>
        <Pill className={customer.isActive ? "bg-c-ok text-c-okt" : "bg-c-bad text-c-badt"}>
          {customer.isActive ? "Active" : "Deactivated"}
        </Pill>
      </div>
      <div className={`text-xs ${customer.twoFactorEnabled ? "text-c-okt" : "text-c-tx3"}`}>{customer.twoFactorEnabled ? "On" : "Off"}</div>
      <div className="sm:flex sm:justify-end">
        <CustomerActions userId={customer.userId} name={customer.name} isActive={customer.isActive} canManage={canManage} />
      </div>
    </li>
  );
}

export default async function CustomersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await requireAdmin();
  const params = await searchParams;

  const search = params.search?.trim().slice(0, 100) || undefined;
  const role = pick(params.role, ["Landlord", "Tenant", "Contractor"] as const);
  const status = pick(params.status, ["active", "inactive"] as const);
  const sort = pick(params.sort, ["created", "name", "email"] as const) ?? "created";
  const direction = pick(params.direction, ["asc", "desc"] as const) ?? (sort === "created" ? "desc" : "asc");
  const page = Number(params.page) >= 1 ? Math.floor(Number(params.page)) : 1;

  const [customers, { can }] = await Promise.all([
    getCustomers(session.backendToken, { search, role, status, sort, direction, page }),
    getPermissions(session),
  ]);
  if (customers.status === "expired") redirect("/session-expired");

  const canManage = can(PERMISSIONS.customersManage);

  // Builds a link to this page with some filters changed, keeping the others. Changing a filter goes back to page 1.
  function href(changes: Partial<Record<keyof SearchParams, string>>) {
    const next: Record<string, string | undefined> = { search, role, status, sort, direction, page: "1", ...changes };
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(next)) if (value) query.set(key, value);
    return `/customers?${query}`;
  }

  return (
    <div className="flex max-w-5xl flex-col gap-5">
      <div className="animate-up">
        <h1 className="text-2xl font-medium tracking-tight">Customers</h1>
        <p className="mt-1 text-c-tx2">Landlords, tenants and contractors who use DomusPRO.</p>
      </div>

      <section className={`${cardClass} animate-up`} style={{ animationDelay: "0.06s" }}>
        {/* A plain GET form: every filter lives in the URL, so no JavaScript is needed. */}
        <form action="/customers" className="mb-4 flex flex-col gap-3">
          {role && <input type="hidden" name="role" value={role} />}
          {/* Keep the chosen sort when searching or changing the status. */}
          <input type="hidden" name="sort" value={sort} />
          <input type="hidden" name="direction" value={direction} />
          <div className="flex gap-2">
            <label className="relative flex-1">
              <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-c-tx3" />
              <input name="search" defaultValue={search} placeholder="Search by name, business or email" className={`${inputClass} pl-10`} />
            </label>
            <button type="submit" className={secondaryButtonClass}>
              Search
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {ROLE_TABS.map((tab) => (
              <Link
                key={tab.label}
                href={href({ role: tab.value })}
                className={`rounded-full border px-3 py-1.5 text-xs ${
                  (role ?? "") === tab.value ? "border-c-ac bg-c-aci text-c-act2" : "border-c-bd2 text-c-tx2 hover:bg-c-sf2"
                }`}
              >
                {tab.label}
              </Link>
            ))}
            <span className="flex-1" />
            <select name="status" defaultValue={status ?? ""} aria-label="Status" className="h-8 rounded-[10px] border border-c-bd2 bg-c-bg px-2 text-xs">
              <option value="">Status: All</option>
              <option value="active">Active</option>
              <option value="inactive">Deactivated</option>
            </select>
          </div>
        </form>
        {/* Sort links, kept outside the form so each one is a single click. */}
        <div className="mb-3 flex flex-wrap gap-3 text-xs text-c-tx2">
          <span>Sort:</span>
          <Link href={href({ sort: "created", direction: "desc" })} className={sort === "created" ? "text-c-act2" : "hover:underline"}>
            Newest
          </Link>
          <Link href={href({ sort: "name", direction: "asc" })} className={sort === "name" ? "text-c-act2" : "hover:underline"}>
            Name
          </Link>
          <Link href={href({ sort: "email", direction: "asc" })} className={sort === "email" ? "text-c-act2" : "hover:underline"}>
            Email
          </Link>
        </div>

        {customers.status !== "ok" ? (
          <Notice>
            {customers.status === "forbidden"
              ? "Your role doesn't have access to customers."
              : "Couldn't load customers right now. Refresh to try again."}
          </Notice>
        ) : customers.data.items.length === 0 ? (
          <Notice>{search || role || status ? "No customers match those filters." : "No customers yet."}</Notice>
        ) : (
          <>
            <div className="hidden grid-cols-[minmax(0,1fr)_100px_110px_60px_110px] gap-4 px-3 pb-2 text-xs text-c-tx3 sm:grid">
              <span>Customer</span>
              <span>Role</span>
              <span>Status</span>
              <span>2FA</span>
              <span />
            </div>
            <ul className="flex flex-col">
              {customers.data.items.map((customer) => (
                <CustomerRow key={customer.userId} customer={customer} canManage={canManage} />
              ))}
            </ul>

            <div className="mt-4 flex items-center justify-between text-[13px] text-c-tx2">
              <span>
                Showing {(customers.data.page - 1) * customers.data.pageSize + 1} to{" "}
                {(customers.data.page - 1) * customers.data.pageSize + customers.data.items.length} of {customers.data.totalCount}
              </span>
              <span className="flex items-center gap-3">
                {customers.data.page > 1 && (
                  <Link href={href({ page: String(customers.data.page - 1) })} className="text-c-act2 hover:underline">
                    Previous
                  </Link>
                )}
                <span>
                  Page {customers.data.page} of {customers.data.totalPages}
                </span>
                {customers.data.page < customers.data.totalPages && (
                  <Link href={href({ page: String(customers.data.page + 1) })} className="text-c-act2 hover:underline">
                    Next
                  </Link>
                )}
              </span>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
