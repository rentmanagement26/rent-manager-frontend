import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuditSettingsList } from "@/components/console/audit-settings-list";
import { Notice, cardClass } from "@/components/console/ui";
import { getAuditSettings } from "@/lib/audit-api";
import { requireAdmin } from "@/lib/auth-guard";

export const metadata: Metadata = { title: "Audit settings" };

export default async function AuditSettingsPage() {
  const session = await requireAdmin();
  const settings = await getAuditSettings(session.backendToken);

  if (settings.status === "expired") {
    redirect("/session-expired");
  }

  return (
    <div className="flex max-w-4xl flex-col gap-5">
      <div className="animate-up">
        <h1 className="text-2xl font-medium tracking-tight">Audit settings</h1>
        <p className="mt-1 text-c-tx2">Choose how much detail each action records.</p>
      </div>

      <div className="animate-up" style={{ animationDelay: "0.06s" }}>
        {settings.status === "ok" ? (
          <AuditSettingsList
            actions={settings.data.actions}
            overrides={settings.data.overrides}
            // The backend only lets a SuperAdmin change these; it enforces this too.
            canManage={session.role === "SuperAdmin"}
          />
        ) : (
          <section className={cardClass}>
            <Notice>
              {settings.status === "forbidden"
                ? "Your role doesn't have access to audit settings."
                : "Couldn't load audit settings right now. Refresh to try again."}
            </Notice>
          </section>
        )}
      </div>
    </div>
  );
}
