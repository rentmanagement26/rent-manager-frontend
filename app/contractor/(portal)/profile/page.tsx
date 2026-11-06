// The contractor's profile: their account details.
import { ProfileSection } from "@/components/profile/profile-section";
import { TenantPageHeading } from "@/components/tenant-page-heading";

export default function ContractorProfilePage() {
  return (
    <div>
      <TenantPageHeading title="Profile" description="Manage your account details." />
      <ProfileSection settingsHref="/contractor/settings" />
    </div>
  );
}
