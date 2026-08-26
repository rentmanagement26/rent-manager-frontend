import { PageHeader } from "@/components/page-header";

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Profile" description="Manage your account details." />
      <div className="bg-white rounded-xl border border-slate-200 p-6 text-sm text-slate-500">
        Profile settings are coming soon.
      </div>
    </div>
  );
}