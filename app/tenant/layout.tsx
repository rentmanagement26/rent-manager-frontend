// The tenant portal shell: the same left sidebar and top bar as the landlord portal. Each page draws its own heading.
import { MenuToggleButton } from "@/components/menu-toggle-button";
import SiteFooter from "@/components/site-footer";
import { TenantAccountMenu } from "@/components/tenant-account-menu";
import { TenantSidebar } from "@/components/tenant-sidebar";
import { requireAuth } from "@/lib/auth-guard";
import { SidebarProvider } from "@/lib/sidebar-context";

export default async function TenantLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth(["Tenant"]);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen flex-col lg:grid lg:grid-cols-[256px_1fr] lg:grid-rows-[auto_minmax(0,1fr)_auto] lg:h-screen lg:overflow-hidden bg-slate-50 text-slate-900">
        <TenantSidebar />

        <div className="hidden lg:flex lg:col-start-2 lg:row-start-1 items-center justify-end gap-4 border-b border-slate-200 bg-slate-50 px-8 py-3">
          <TenantAccountMenu fullName={session.fullName} email={session.email} role={session.role} />
        </div>

        <main className="flex flex-1 flex-col lg:block lg:min-h-0 lg:overflow-y-auto px-4 pb-8 sm:px-8 lg:pt-8 lg:col-start-2 lg:row-start-2">
          <div className="lg:hidden py-4 -mx-4 px-4 sm:-mx-8 sm:px-8 mb-6 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center justify-between gap-4">
              <MenuToggleButton />
              <TenantAccountMenu fullName={session.fullName} email={session.email} role={session.role} />
            </div>
          </div>
          <div className="mx-auto w-full max-w-screen-2xl flex-1">{children}</div>
          <div className="lg:hidden -mx-4 sm:-mx-8 mt-auto pt-8">
            <SiteFooter />
          </div>
        </main>

        <div className="hidden lg:block lg:col-start-2 lg:row-start-3">
          <SiteFooter />
        </div>
      </div>
    </SidebarProvider>
  );
}
