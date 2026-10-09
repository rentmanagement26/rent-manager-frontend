import { PageHeader } from "@/components/page-header";
import { ProfileSection } from "@/components/profile/profile-section";

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Profile" description="Manage your account details." />
      <ProfileSection settingsHref="/landlord/settings" />
    </div>
  );
}
