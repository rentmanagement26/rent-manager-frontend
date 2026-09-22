import { resendTenantInviteAction } from "./actions";
import type { TenantInviteListItem, TenantInviteStats } from "@/lib/types";

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
}: {
  invites: TenantInviteListItem[];
  stats: TenantInviteStats;
}) {
  if (invites.length === 0) return null;

  const grouped = groupInvites(invites);

  return (
    <div className="mt-8 max-w-2xl">
      <div className="grid grid-cols-4 gap-3 mb-4">
        <StatCard label="Waiting on tenant" value={stats.pending} />
        <StatCard label="Accepted" value={stats.accepted} />
        <StatCard label="Declined" value={stats.declined} />
        <StatCard label="Expired, unused" value={stats.expired} />
      </div>

      <h3 className="text-sm font-semibold text-heading mb-2">Sent invites</h3>

      <div className="bg-white rounded-2xl border border-default shadow-sm divide-y divide-default">
        {grouped.map((invite) => {
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
      </div>
    </div>
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
