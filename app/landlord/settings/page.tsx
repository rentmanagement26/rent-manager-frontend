import { PageHeader } from "@/components/page-header";
import { SecuritySection } from "@/components/security/security-section";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Configure your account and preferences." />
      <SecuritySection />
    </div>
  );
}
