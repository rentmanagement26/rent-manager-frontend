import Link from "next/link";
import { redirect } from "next/navigation";
import { MarkAllReadButton } from "@/components/mark-all-read-button";
import { NotificationList } from "@/components/notification-list";
import { SessionExpiredError } from "@/lib/api-error";
import { requireBackendToken } from "@/lib/auth-guard";
import { getMyNotifications } from "@/lib/notifications-api";
import type { NotificationItem } from "@/lib/types";

export async function NotificationsView({ basePath, unreadOnly }: { basePath: string; unreadOnly: boolean }) {
  const session = await requireBackendToken();

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
      <div className="flex max-w-2xl items-center justify-between gap-4">
        <div className="flex gap-2">
          <Link href={basePath} className={tabClass(!unreadOnly)}>
            All
          </Link>
          <Link href={`${basePath}?filter=unread`} className={tabClass(unreadOnly)}>
            Unread · {unreadCount}
          </Link>
        </div>
        {unreadCount > 0 && <MarkAllReadButton />}
      </div>

      <NotificationList
        items={items}
        emptyMessage={unreadOnly ? "You're all caught up." : "No notifications yet."}
      />
    </div>
  );
}
