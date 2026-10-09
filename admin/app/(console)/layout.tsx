import { cookies } from "next/headers";
import { logoutAction } from "@/app/actions";
import { ConsoleShell } from "@/components/console/console-shell";
import { requireAdmin } from "@/lib/auth-guard";

// Every page under this layout needs a signed-in admin.
export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  const cookieStore = await cookies();
  const theme = cookieStore.get("admin_theme")?.value === "dark" ? "dark" : "light";

  return (
    <ConsoleShell initialTheme={theme} fullName={session.fullName} role={session.role} logoutAction={logoutAction}>
      {children}
    </ConsoleShell>
  );
}
