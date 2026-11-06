// The contractor's notifications: new offers, quote requests and changes to their jobs.
import { NotificationsView } from "@/components/notifications-view";
import { TenantPageHeading } from "@/components/tenant-page-heading";

export default async function ContractorNotificationsPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const { filter } = await searchParams;

  return (
    <div>
      <TenantPageHeading title="Notifications" description="New jobs, quote requests and changes to your work." />
      <NotificationsView basePath="/contractor/notifications" unreadOnly={filter === "unread"} />
    </div>
  );
}
