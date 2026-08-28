import { requireAuth } from "@/lib/auth-guard";
import { LandlordSidebar } from "@/components/landlord-sidebar";
import { PageHeaderSlot } from "@/components/page-header-slot";
import { PageHeaderProvider } from "@/lib/page-header-context";
import { SidebarProvider } from "@/lib/sidebar-context";
import { MenuToggleButton } from "@/components/menu-toggle-button";
import { AccountMenu } from "@/components/account-menu";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth(["Admin", "Landlord"]);
  const role = session.role || "Landlord";

  return (
    <SidebarProvider>
      <PageHeaderProvider>
        <div className="lg:grid lg:grid-cols-[256px_1fr] lg:grid-rows-[auto_1fr] lg:h-screen lg:overflow-hidden bg-slate-50 text-slate-900">
          <LandlordSidebar email={session.email} />

          <div className="hidden lg:flex lg:col-start-2 lg:row-start-1 items-center justify-between gap-4 border-b border-slate-200 bg-slate-50 px-8">
            <div className="min-w-0 flex-1">
              <PageHeaderSlot />
            </div>
            <AccountMenu email={session.email} role={role} />
          </div>

          <main className="h-screen overflow-y-auto px-8 pb-8 lg:pt-8 lg:h-auto lg:col-start-2 lg:row-start-2">
            <div className="lg:hidden py-6 -mx-8 px-8 mb-6 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <PageHeaderSlot />
                </div>
                <div className="flex items-center gap-3">
                  <AccountMenu email={session.email} role={role} />
                  <MenuToggleButton />
                </div>
              </div>
            </div>
            <div className="max-w-6xl mx-auto">{children}</div>
          </main>
        </div>
      </PageHeaderProvider>
    </SidebarProvider>
  );
}