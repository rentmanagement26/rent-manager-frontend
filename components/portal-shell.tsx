// The page frame shared by the tenant and contractor portals: a left sidebar, a top bar with the account menu, the content (with a Back button
// on nested pages), and the footer. On phones the sidebar is a drawer opened from the menu button. Each portal passes its own sidebar and
// account menu; each page draws its own heading.
import type { ReactNode } from "react";
import { BackButton } from "@/components/back-button";
import { MenuToggleButton } from "@/components/menu-toggle-button";
import SiteFooter from "@/components/site-footer";
import { SidebarProvider } from "@/lib/sidebar-context";

export function PortalShell({ sidebar, accountMenu, children }: { sidebar: ReactNode; accountMenu: ReactNode; children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen flex-col lg:grid lg:grid-cols-[256px_1fr] lg:grid-rows-[auto_minmax(0,1fr)_auto] lg:h-screen lg:overflow-hidden bg-slate-50 text-slate-900">
        {sidebar}

        <div className="hidden lg:flex lg:col-start-2 lg:row-start-1 items-center justify-end gap-4 border-b border-slate-200 bg-slate-50 px-8 py-3">{accountMenu}</div>

        <main className="flex flex-1 flex-col lg:block lg:min-h-0 lg:overflow-y-auto px-4 pb-8 sm:px-8 lg:pt-8 lg:col-start-2 lg:row-start-2">
          <div className="lg:hidden py-4 -mx-4 px-4 sm:-mx-8 sm:px-8 mb-6 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center justify-between gap-4">
              <MenuToggleButton />
              {accountMenu}
            </div>
          </div>
          <div className="mx-auto w-full max-w-screen-2xl flex-1">
            <BackButton />
            {children}
          </div>
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
