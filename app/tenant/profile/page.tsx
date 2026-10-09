import { ProfileSection } from "@/components/profile/profile-section";
import { TenantPageHeading } from "@/components/tenant-page-heading";

export default function TenantProfilePage() {
  return (
    <div>
      <TenantPageHeading title="Profile" description="Manage your account details." />
      <ProfileSection settingsHref="/tenant/settings" />
    </div>
  );
}
