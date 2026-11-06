// The contractor's security settings: password and two-step sign-in.
import { SecuritySection } from "@/components/security/security-section";
import { TenantPageHeading } from "@/components/tenant-page-heading";

export default function ContractorSettingsPage() {
  return (
    <div>
      <TenantPageHeading title="Security settings" description="Protect your account." />
      <SecuritySection />
    </div>
  );
}
