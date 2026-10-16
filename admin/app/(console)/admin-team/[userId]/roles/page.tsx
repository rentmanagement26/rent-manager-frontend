import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { StaffRolesForm } from "@/components/console/staff-roles-form";
import { Notice, cardClass } from "@/components/console/ui";
import { requireAdmin } from "@/lib/auth-guard";
import { getStaff } from "@/lib/staff-api";

export const metadata: Metadata = { title: "Edit roles" };

// /admin-team/<userId>/roles: choose which roles one staff member has. SuperAdmin only.
// The backend enforces this as well (staff.manage permission, and a fresh authenticator code on save).
export default async function StaffRolesPage({ params }: { params: Promise<{ userId: string }> }) {
  const session = await requireAdmin();
  const { userId } = await params;

  const backLink = (
    <Link href="/admin-team" className="flex w-fit items-center gap-1.5 text-[13px] text-c-act2 hover:underline">
      <ArrowLeft size={14} /> Admin team
    </Link>
  );

  if (session.role !== "SuperAdmin") {
    return (
      <div className="flex max-w-3xl flex-col gap-5">
        {backLink}
        <Notice>Only a SuperAdmin can manage the admin team.</Notice>
      </div>
    );
  }

  const staff = await getStaff(session.backendToken);
  if (staff.status === "expired") redirect("/session-expired");
  if (staff.status !== "ok") {
    return (
      <div className="flex max-w-3xl flex-col gap-5">
        {backLink}
        <Notice>Couldn&apos;t load the team right now. Refresh to try again.</Notice>
      </div>
    );
  }

  // Unknown id, or your own account (you can't change your own roles).
  const member = staff.data.find((m) => m.userId === userId);
  if (!member || member.userId === session.id) notFound();

  return (
    <div className="flex max-w-3xl flex-col gap-5">
      {backLink}
      <div className="animate-up">
        <h1 className="text-2xl font-medium tracking-tight">Roles for {member.name}</h1>
        <p className="mt-1 text-c-tx2">Pick one or more. Their permissions come from these roles.</p>
      </div>

      <section className={`${cardClass} animate-up`} style={{ animationDelay: "0.06s" }}>
        <StaffRolesForm member={member} />
      </section>
    </div>
  );
}
