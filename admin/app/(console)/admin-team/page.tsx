import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { StaffTeam } from "@/components/console/staff-team";
import { Notice, cardClass } from "@/components/console/ui";
import { requireAdmin } from "@/lib/auth-guard";
import { getStaff } from "@/lib/staff-api";

export const metadata: Metadata = { title: "Admin team" };

// /admin-team: the staff accounts that can sign in to this console, and what each may do.
// SuperAdmin only. The backend enforces it as well (the staff.manage permission).
export default async function AdminTeamPage() {
  const session = await requireAdmin();

  const staff = await getStaff(session.backendToken);
  if (staff.status === "expired") redirect("/session-expired");

  return (
    <div className="flex max-w-5xl flex-col gap-5">
      <div className="animate-up">
        <h1 className="text-2xl font-medium tracking-tight">Admin team</h1>
        <p className="mt-1 text-c-tx2">
          Add staff, change their roles, and reset their sign-in when they&apos;re locked out.
        </p>
      </div>

      <section className={`${cardClass} animate-up`} style={{ animationDelay: "0.06s" }}>
        {staff.status === "forbidden" || session.role !== "SuperAdmin" ? (
          <Notice>Only a SuperAdmin can manage the admin team.</Notice>
        ) : staff.status === "error" ? (
          <Notice>Couldn&apos;t load the team right now. Refresh to try again.</Notice>
        ) : (
          <StaffTeam staff={staff.data} currentUserId={session.id} />
        )}
      </section>
    </div>
  );
}
