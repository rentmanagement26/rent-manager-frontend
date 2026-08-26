import { PageHeader } from "@/components/page-header";

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Billing" description="Manage your plan and payment details." />
      <div className="bg-white rounded-xl border border-slate-200 p-6 text-sm text-slate-500">
        Plans and billing are coming soon.
      </div>
    </div>
  );
}