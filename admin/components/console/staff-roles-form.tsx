"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CodeField, RoleChecks, codeLooksValid, useAction } from "@/components/console/staff-team";
import { ErrorBox, primaryButtonClass, secondaryButtonClass } from "@/components/console/ui";
import { setStaffRolesAction } from "@/lib/staff-actions";
import type { StaffMember } from "@/lib/types";

// The form on the "Edit roles" page: tick the roles, enter your authenticator code, save.
// After saving it goes back to the Admin team list, which reloads with the new roles.
export function StaffRolesForm({ member }: { member: StaffMember }) {
  const router = useRouter();

  // Start from the roles they have now.
  const [roles, setRoles] = useState<string[]>(member.roles);
  const [code, setCode] = useState("");
  const { busy, error, run } = useAction();

  const canSave = roles.length > 0 && codeLooksValid(code) && !busy;

  function goBack() {
    router.push("/admin-team");
  }

  return (
    <div className="flex flex-col gap-4">
      <RoleChecks selected={roles} onChange={setRoles} />
      <CodeField value={code} onChange={setCode} />
      <ErrorBox message={error} />

      <div className="flex gap-2">
        <button
          type="button"
          disabled={!canSave}
          onClick={() =>
            run(() => setStaffRolesAction(member.userId, roles, code), () => {
              goBack();
              router.refresh();
            })
          }
          className={primaryButtonClass}
        >
          {busy ? "Saving…" : "Save roles"}
        </button>
        <button type="button" disabled={busy} onClick={goBack} className={secondaryButtonClass}>
          Cancel
        </button>
      </div>
    </div>
  );
}
