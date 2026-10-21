import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CustomerActions } from "@/components/console/customer-actions";
import { Notice, Pill, cardClass } from "@/components/console/ui";
import { requireAdmin } from "@/lib/auth-guard";
import { getCustomer } from "@/lib/customer-api";
import { initials } from "@/lib/format";
import { getPermissions, PERMISSIONS } from "@/lib/permissions";

export const metadata: Metadata = { title: "Customer" };

// One line of the details list: a label on the left, the value on the right.
function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-c-bd py-3 text-sm first:border-t-0">
      <span className="text-c-tx2">{label}</span>
      <span className="text-right">{children}</span>
    </div>
  );
}

// Customer details page: /customers/<userId>. Phone and other details live here, not in the list (data minimization).
export default async function CustomerDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const session = await requireAdmin();
  const userId = (await params).userId;
  // The id is a GUID-like string; refuse anything odd before calling the backend.
  if (!/^[\w-]{8,64}$/.test(userId)) notFound();

  const [customer, { can }] = await Promise.all([getCustomer(session.backendToken, userId), getPermissions(session)]);
  if (customer.status === "expired") redirect("/session-expired");

  const backLink = (
    <Link href="/customers" className="flex items-center gap-1.5 text-[13px] text-c-act2 hover:underline">
      <ArrowLeft size={14} /> All customers
    </Link>
  );

  if (customer.status !== "ok") {
    return (
      <div className="flex max-w-3xl flex-col gap-5">
        {backLink}
        <Notice>
          {customer.status === "forbidden"
            ? "Your role doesn't have access to customers."
            : "Couldn't load this customer. They may not exist, or try refreshing."}
        </Notice>
      </div>
    );
  }

  const c = customer.data;
  const role = c.roles[0] ?? "Customer";

  return (
    <div className="flex max-w-3xl flex-col gap-5">
      {backLink}

      <section className={`${cardClass} animate-up flex flex-wrap items-center gap-4`}>
        <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-c-aci text-sm font-medium text-c-act2">
          {initials(c.name)}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-medium tracking-tight">{c.name}</h1>
          <p className="truncate text-sm text-c-tx2">{c.email ?? "No email"}</p>
        </div>
        <Pill className={c.isActive ? "bg-c-ok text-c-okt" : "bg-c-bad text-c-badt"}>{c.isActive ? "Active" : "Deactivated"}</Pill>
        <CustomerActions
          userId={c.userId}
          name={c.name}
          isActive={c.isActive}
          canManage={can(PERMISSIONS.customersManage)}
          showDetails={false}
        />
      </section>

      <section className={`${cardClass} animate-up`} style={{ animationDelay: "0.06s" }}>
        <h2 className="mb-2 text-lg font-medium">Details</h2>
        <Detail label="Role">
          {role}
          {c.landlord?.businessName && ` · ${c.landlord.businessName}`}
          {c.contractor?.companyName && ` · ${c.contractor.companyName}`}
          {c.contractor?.trade && ` (${c.contractor.trade})`}
          {c.tenant?.landlordName && ` of ${c.tenant.landlordName}`}
        </Detail>
        <Detail label="Phone">{c.phoneNumber ?? "Not given"}</Detail>
        <Detail label="Email confirmed">{c.emailConfirmed ? "Yes" : "No"}</Detail>
        <Detail label="Two-factor">{c.twoFactorEnabled ? "On" : "Off"}</Detail>
        <Detail label="Locked out">{c.lockedOut ? "Yes" : "No"}</Detail>
        <Detail label="Joined">
          {new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(c.createdAt) ? c.createdAt : `${c.createdAt}Z`).toLocaleDateString("en-CA", {
            timeZone: "America/Toronto",
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </Detail>
        {c.landlord && (
          <Link href={`/landlords/${c.landlord.landlordProfileId}`} className="mt-3 inline-block text-[13px] text-c-act2 hover:underline">
            Open plan and usage →
          </Link>
        )}
      </section>
    </div>
  );
}
