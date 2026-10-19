// The Catalog page: the features and limits that plans are built from.
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CatalogManager } from "@/components/console/catalog-manager";
import { Notice, cardClass } from "@/components/console/ui";
import { requireAdmin } from "@/lib/auth-guard";
import { getCatalog } from "@/lib/catalog-api";
import { getPermissions, PERMISSIONS } from "@/lib/permissions";

export const metadata: Metadata = { title: "Catalog" };

export default async function CatalogPage() {
  const session = await requireAdmin();
  const [catalog, { can }] = await Promise.all([getCatalog(session.backendToken), getPermissions(session)]);

  if (catalog.status === "expired") {
    redirect("/session-expired");
  }

  return (
    <div className="flex max-w-3xl flex-col gap-5">
      <div className="animate-up">
        <h1 className="text-2xl font-medium tracking-tight">Catalog</h1>
        <p className="mt-1 text-c-tx2">The features and limits that plans are built from.</p>
      </div>

      <div className="animate-up flex flex-col gap-5" style={{ animationDelay: "0.06s" }}>
        {catalog.status === "ok" ? (
          // The backend enforces catalog.manage too; hiding the buttons just avoids dead ends.
          <CatalogManager catalog={catalog.data} canEdit={can(PERMISSIONS.catalogManage)} />
        ) : (
          <section className={cardClass}>
            <Notice>
              {catalog.status === "forbidden"
                ? "Your role doesn't have access to the catalog."
                : "Couldn't load the catalog right now. Refresh to try again."}
            </Notice>
          </section>
        )}
      </div>
    </div>
  );
}
