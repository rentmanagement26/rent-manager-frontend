import { NotificationsView } from "@/components/notifications-view";
import { TenantPageHeading } from "@/components/tenant-page-heading";

export default async function TenantNotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;

  return (
    <div>
      <TenantPageHeading title="Notifications" description="Updates about your home." />
      <NotificationsView basePath="/tenant/notifications" unreadOnly={filter === "unread"} />
    </div>
  );
}
