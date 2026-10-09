import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { SessionExpiredError } from "@/lib/api-error";
import { requireBackendToken } from "@/lib/auth-guard";
import { getMyNotifications } from "@/lib/notifications-api";
import type { NotificationItem } from "@/lib/types";
import { NotificationList } from "./notification-list";

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  const unreadOnly = filter === "unread";
  const session = await requireBackendToken(["Admin", "Landlord"]);

  let items: NotificationItem[] | null = null;
  try {
    items = await getMyNotifications(session.backendToken, unreadOnly);
  } catch (err) {
    if (!(err instanceof SessionExpiredError)) throw err;
  }

  if (!items) {
    redirect("/session-expired");
  }

  const unreadCount = unreadOnly ? items.length : items.filter((item) => !item.isRead).length;

  const tabClass = (active: boolean) =>
    `rounded-full px-3.5 py-1.5 text-sm ${
      active ? "bg-accent-tint font-semibold text-accent" : "border border-default text-muted hover:bg-subtle"
    }`;

  return (
    <div className="space-y-5">
      <PageHeader title="Notifications" description="Updates about your properties and tenants." />

      <div className="flex gap-2">
        <Link href="/landlord/notifications" className={tabClass(!unreadOnly)}>
          All
        </Link>
        <Link href="/landlord/notifications?filter=unread" className={tabClass(unreadOnly)}>
          Unread · {unreadCount}
        </Link>
      </div>

      <NotificationList
        items={items}
        emptyMessage={unreadOnly ? "You're all caught up." : "No notifications yet."}
      />
    </div>
  );
}
