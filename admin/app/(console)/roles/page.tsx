import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RolesEditor } from "@/components/console/roles-editor";
import { Notice } from "@/components/console/ui";
import { requireAdmin } from "@/lib/auth-guard";
import { getRoles } from "@/lib/roles-api";

export const metadata: Metadata = { title: "Roles" };

// /roles: what each staff role (Support, Billing) is allowed to do. SuperAdmin only.
// The backend enforces it as well (the roles.manage permission, plus an authenticator code on save).
export default async function RolesPage() {
  const session = await requireAdmin();

  const roles = session.role === "SuperAdmin" ? await getRoles(session.backendToken) : null;
  if (roles?.status === "expired") redirect("/session-expired");

  return (
    <div className="flex max-w-4xl flex-col gap-5">
      <div className="animate-up">
        <h1 className="text-2xl font-medium tracking-tight">Roles</h1>
        <p className="mt-1 text-c-tx2">
          Choose what each staff role can do. Changes apply straight away to everyone in the role.
        </p>
      </div>

      <div className="animate-up" style={{ animationDelay: "0.06s" }}>
        {!roles || roles.status === "forbidden" ? (
          <Notice>Only a SuperAdmin can manage roles.</Notice>
        ) : roles.status !== "ok" ? (
          <Notice>Couldn&apos;t load the roles right now. Refresh to try again.</Notice>
        ) : (
          <>
            <RolesEditor overview={roles.data} />
            <p className="mt-4 flex gap-2 text-xs text-c-tx2">
              Some permissions always stay with SuperAdmin: managing staff, editing roles, changing what is audited,
              overriding plan limits, resetting customer two-factor, and switching landlord accounts on or off.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
