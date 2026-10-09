import { NotificationsView } from "@/components/notifications-view";
import { PageHeader } from "@/components/page-header";

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;

  return (
    <div className="space-y-5">
      <PageHeader title="Notifications" description="Updates about your properties and tenants." />
      <NotificationsView basePath="/landlord/notifications" unreadOnly={filter === "unread"} />
    </div>
  );
}
