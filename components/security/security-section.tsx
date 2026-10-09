import { redirect } from "next/navigation";
import { SessionExpiredError } from "@/lib/api-error";
import { requireBackendToken } from "@/lib/auth-guard";
import { getTwoFactorStatus } from "@/lib/two-factor-api";
import type { TwoFactorStatus } from "@/lib/types";
import { SecuritySettings } from "./security-settings";

export async function SecuritySection() {
  const session = await requireBackendToken();

  let status: TwoFactorStatus | null = null;
  try {
    status = await getTwoFactorStatus(session.backendToken);
  } catch (err) {
    if (!(err instanceof SessionExpiredError)) throw err;
  }

  if (!status) {
    redirect("/session-expired");
  }

  return <SecuritySettings status={status} />;
}
