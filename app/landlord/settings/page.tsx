import { PageHeader } from "@/components/page-header";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Configure your account and preferences." />
      <div className="bg-white rounded-xl border border-slate-200 p-6 text-sm text-slate-500">
        Settings are coming soon.
      </div>
    </div>
  );
}