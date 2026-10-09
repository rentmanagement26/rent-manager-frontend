import { SecuritySection } from "@/components/security/security-section";
import { TenantPageHeading } from "@/components/tenant-page-heading";

export default function TenantSettingsPage() {
  return (
    <div>
      <TenantPageHeading title="Security settings" description="Protect your account." />
      <SecuritySection />
    </div>
  );
}
