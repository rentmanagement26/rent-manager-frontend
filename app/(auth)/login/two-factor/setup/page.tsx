import { redirect } from "next/navigation";
import { AuthSplitLayout } from "@/components/auth-split-layout";
import { isSafeRedirectTarget } from "@/lib/auth-guard";
import { getTwoFactorToken } from "@/lib/auth-session";
import { TotpEnrollment } from "./totp-enrollment";

export default async function TwoFactorSetupPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect: redirectParam } = await searchParams;

  if (!(await getTwoFactorToken())) {
    redirect("/login");
  }

  return (
    <AuthSplitLayout>
      <TotpEnrollment redirectTo={isSafeRedirectTarget(redirectParam) ? redirectParam : ""} />
    </AuthSplitLayout>
  );
}
