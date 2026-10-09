import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth-card";
import { getTwoFactorToken } from "@/lib/auth-session";
import { TotpEnrollment } from "./totp-enrollment";

export const metadata: Metadata = { title: "Set up two-step verification" };

export default async function SetupPage() {
  if (!(await getTwoFactorToken())) {
    redirect("/login");
  }

  return (
    <AuthCard step={2}>
      <TotpEnrollment />
    </AuthCard>
  );
}
