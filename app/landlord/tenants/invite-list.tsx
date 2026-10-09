import Link from "next/link";
import { resendTenantInviteAction } from "./actions";
import type { TenantInviteListItem, TenantInviteStats } from "@/lib/types";

const PAGE_SIZE = 5;
const BASE_PATH = "/landlord/tenants";

const STATUS_STYLES: Record<string, string> = {
  Pending: "bg-amber-50 text-amber-700",
  Accepted: "bg-green-50 text-green-700",
  Declined: "bg-gray-100 text-gray-600",
  Expired: "bg-red-50 text-red-700",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-CA", { month: "short", day: "numeric" });
}

function daysUntil(iso: string) {
  const msLeft = new Date(iso).getTime() - Date.now();
  if (msLeft <= 0) return -1;
  return Math.floor(msLeft / 86_400_000);
}

function groupInvites(invites: TenantInviteListItem[]) {
  const groups = new Map<string, TenantInviteListItem & { resendCount: number }>();
  for (const invite of invites) {
    const key = `${invite.email}|${invite.unitLabel}|${invite.propertyName}`;
    const existing = groups.get(key);
    if (!existing || new Date(invite.createdAt) > new Date(existing.createdAt)) {
      groups.set(key, { ...invite, resendCount: (existing?.resendCount ?? 0) + 1 });
    } else {
      existing.resendCount += 1;
    }
  }
  return [...groups.values()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function InviteList({
  invites,
  stats,
  page,
}: {
  invites: TenantInviteListItem[];
  stats: TenantInviteStats;
  page: number;
}) {
  if (invites.length === 0) return null;

  const grouped = groupInvites(invites);
  const totalPages = Math.ceil(grouped.length / PAGE_SIZE);
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const firstIndex = (currentPage - 1) * PAGE_SIZE;
  const visible = grouped.slice(firstIndex, firstIndex + PAGE_SIZE);

  return (
    <div className="mt-8 max-w-2xl">
      <div className="grid grid-cols-4 gap-3 mb-4">
        <StatCard label="Waiting on tenant" value={stats.pending} />
        <StatCard label="Accepted" value={stats.accepted} />
        <StatCard label="Declined" value={stats.declined} />
        <StatCard label="Expired, unused" value={stats.expired} />
      </div>

      <h3 className="text-sm font-semibold text-heading mb-2">Sent invites</h3>

      <div className="bg-white rounded-2xl border border-default shadow-sm divide-y divide-default overflow-hidden">
        {visible.map((invite) => {
          const days = daysUntil(invite.expiresAt);
          const expiryUrgent = invite.status === "Pending" && days <= 2;
          const expiryText =
            invite.status !== "Pending"
              ? null
              : days === -1
              ? "Expired"
              : days === 0
              ? "Expires today"
              : days === 1
              ? "Expires tomorrow"
              : days <= 2
              ? `Expires in ${days} days`
              : `Expires ${formatDate(invite.expiresAt)}`;

          return (
            <div key={invite.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
              <div className="min-w-0">
                <p className="text-sm font-medium text-heading truncate">{invite.email}</p>
                <p className="text-xs text-muted truncate">
                  Invited to {invite.unitLabel}, {invite.propertyName}
                </p>
                <p className="text-xs text-muted mt-0.5">
                  Sent {formatDate(invite.createdAt)}
                  {invite.resendCount > 1 ? ` · resent ${invite.resendCount - 1}x` : ""}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <span
                    className={`inline-block rounded-lg px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[invite.status] ?? "bg-gray-100 text-gray-600"}`}
                  >
                    {invite.status}
                  </span>
                  {expiryText && (
                    <p className={`text-xs mt-1 ${expiryUrgent ? "text-red-600" : "text-muted"}`}>
                      {expiryText}
                    </p>
                  )}
                </div>

                {invite.status === "Pending" && (
                  <form action={resendTenantInviteAction}>
                    <input type="hidden" name="inviteId" value={invite.id} />
                    <button
                      type="submit"
                      className="rounded-lg border border-default px-3 py-1.5 text-xs font-semibold text-heading hover:bg-subtle whitespace-nowrap"
                    >
                      Resend
                    </button>
                  </form>
                )}
              </div>
            </div>
          );
        })}

        {totalPages > 1 && (
          <Pager
            currentPage={currentPage}
            totalPages={totalPages}
            first={firstIndex + 1}
            last={firstIndex + visible.length}
            total={grouped.length}
          />
        )}
      </div>
    </div>
  );
}

function pageHref(page: number) {
  return page === 1 ? BASE_PATH : `${BASE_PATH}?invitesPage=${page}`;
}

function Pager({
  currentPage,
  totalPages,
  first,
  last,
  total,
}: {
  currentPage: number;
  totalPages: number;
  first: number;
  last: number;
  total: number;
}) {
  const buttonClass = "rounded-lg border px-3 py-1.5 text-xs font-semibold";
  const activeClass = `${buttonClass} border-default bg-white text-heading hover:bg-subtle`;
  const inactiveClass = `${buttonClass} border-transparent text-muted`;

  return (
    <nav aria-label="Invite pages" className="flex items-center justify-between gap-3 bg-subtle px-5 py-3">
      <p className="text-xs text-muted">
        Showing {first === last ? first : `${first}–${last}`} of {total}
      </p>
      <div className="flex items-center gap-2">
        {currentPage > 1 ? (
          <Link href={pageHref(currentPage - 1)} className={activeClass}>
            Previous
          </Link>
        ) : (
          <span className={inactiveClass} aria-disabled="true">
            Previous
          </span>
        )}
        <span className="text-xs text-muted">
          Page {currentPage} of {totalPages}
        </span>
        {currentPage < totalPages ? (
          <Link href={pageHref(currentPage + 1)} className={activeClass}>
            Next
          </Link>
        ) : (
          <span className={inactiveClass} aria-disabled="true">
            Next
          </span>
        )}
      </div>
    </nav>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-subtle rounded-xl px-4 py-3">
      <p className="text-xs text-muted mb-1">{label}</p>
      <p className="text-xl font-semibold text-heading">{value}</p>
    </div>
  );
}
