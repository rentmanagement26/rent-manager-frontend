import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProvinceList } from "@/components/console/province-list";
import { Notice } from "@/components/console/ui";
import { requireAdmin } from "@/lib/auth-guard";
import { getProvinceSettings } from "@/lib/document-api";
import { getPermissions, PERMISSIONS } from "@/lib/permissions";

export const metadata: Metadata = { title: "Documents" };

// Documents: where lease documents may be signed online, province by province. SuperAdmin only.
export default async function DocumentsPage() {
  const session = await requireAdmin();

  const [provinces, { can }] = await Promise.all([getProvinceSettings(session.backendToken), getPermissions(session)]);
  if (provinces.status === "expired") redirect("/session-expired");

  return (
    <div className="flex max-w-5xl flex-col gap-5">
      <div className="animate-up">
        <h1 className="text-2xl font-medium tracking-tight">Documents</h1>
        <p className="mt-1 text-c-tx2">Where lease documents may be signed online. Paper signing is never affected.</p>
      </div>

      <p className="animate-up rounded-[10px] bg-c-wr px-3.5 py-2.5 text-[13px] text-c-wrt">
        Every province starts off. A landlord can only sign online where the province is on and their plan includes online signing. Switching a province off
        stops it at once, also for documents already sent.
      </p>

      {provinces.status !== "ok" ? (
        <Notice>
          {provinces.status === "forbidden" ? "Only a SuperAdmin can change online signing." : "Couldn't load the provinces right now. Refresh to try again."}
        </Notice>
      ) : (
        <ProvinceList initial={provinces.data} canManage={can(PERMISSIONS.documentsManage)} />
      )}
    </div>
  );
}
