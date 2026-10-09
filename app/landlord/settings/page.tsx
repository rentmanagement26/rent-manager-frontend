import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { requireBackendToken } from "@/lib/auth-guard";
import { SessionExpiredError, getTwoFactorStatus } from "@/lib/two-factor-api";
import type { TwoFactorStatus } from "@/lib/types";
import { SecuritySettings } from "./security-settings";

export default async function SettingsPage() {
  const session = await requireBackendToken(["Admin", "Landlord"]);

  let status: TwoFactorStatus | null = null;
  try {
    status = await getTwoFactorStatus(session.backendToken);
  } catch (err) {
    if (!(err instanceof SessionExpiredError)) throw err;
  }

  if (!status) {
    redirect("/session-expired");
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Configure your account and preferences." />
      <SecuritySettings status={status} />
    </div>
  );
}
