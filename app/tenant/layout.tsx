import Image from "next/image";
import Link from "next/link";
import SiteFooter from "@/components/site-footer";
import { TenantAccountMenu } from "@/components/tenant-account-menu";
import { requireAuth } from "@/lib/auth-guard";

export default async function TenantLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth(["Tenant"]);

  return (
    <div className="flex flex-1 flex-col bg-slate-50 text-slate-900 lg:h-screen lg:overflow-hidden">
      <header className="shrink-0 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-8">
          <Link href="/tenant">
            <Image
              src="/domuspro-logo.png"
              alt="DomusPRO"
              width={140}
              height={46}
              priority
              className="h-auto w-auto"
            />
          </Link>
          <TenantAccountMenu fullName={session.fullName} email={session.email} role={session.role} />
        </div>
      </header>

      <main className="flex-1 lg:min-h-0 lg:overflow-y-auto">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8 sm:py-8">{children}</div>
      </main>

      <SiteFooter />
    </div>
  );
}
