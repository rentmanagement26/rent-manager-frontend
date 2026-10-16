"use client";

import { ChevronDown, Crown, Headset, Lock, Receipt, type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CodeField, codeLooksValid, useAction } from "@/components/console/staff-team";
import { ErrorBox, primaryButtonClass, secondaryButtonClass } from "@/components/console/ui";
import { setRolePermissionsAction } from "@/lib/staff-actions";
import type { PermissionInfo, RoleInfo, RolesOverview } from "@/lib/types";

// How each staff role looks on its card: a short description, an icon, and tint classes.
const ROLE_STYLE: Record<string, { description: string; icon: LucideIcon; tint: string }> = {
  SuperAdmin: { description: "Every permission, always. Can't be edited.", icon: Crown, tint: "bg-c-bad text-c-badt" },
  Support: { description: "Helps landlords and grants extra allowances.", icon: Headset, tint: "bg-c-aci text-c-act2" },
  Billing: { description: "Manages packages, prices and plan changes.", icon: Receipt, tint: "bg-c-pu text-c-put" },
};

// Plain names for the permission groups (the part of a permission before the dot).
const AREA_LABEL: Record<string, string> = {
  landlords: "Landlords",
  users: "Customer accounts",
  packages: "Packages",
  catalog: "Feature catalogue",
  subscriptions: "Plan changes",
  overrides: "Allowances",
  audit: "Audit log",
  staff: "Staff",
  roles: "Roles",
};

// The Roles page: one card per staff role. Opening a card shows its permissions as switches, grouped by area.
// Saving needs the admin's authenticator code. Changes apply at once to everyone in the role.
export function RolesEditor({ overview }: { overview: RolesOverview }) {
  const [openRole, setOpenRole] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-3">
      {overview.roles.map((role) => (
        <RoleCard
          key={role.name}
          role={role}
          catalogue={overview.permissions}
          isOpen={openRole === role.name}
          onToggle={() => setOpenRole(openRole === role.name ? null : role.name)}
        />
      ))}
    </div>
  );
}

function RoleCard({
  role,
  catalogue,
  isOpen,
  onToggle,
}: {
  role: RoleInfo;
  catalogue: PermissionInfo[];
  isOpen: boolean;
  onToggle: () => void;
}) {
  const router = useRouter();
  const style = ROLE_STYLE[role.name] ?? ROLE_STYLE.Support;
  const Icon = style.icon;

  // What the admin has ticked so far, and the code for saving. `role.permissions` is what is saved today.
  const [draft, setDraft] = useState<string[]>(role.permissions);
  const [code, setCode] = useState("");
  const { busy, error, run } = useAction();

  // Only permissions that can be handed to this role count towards the total (SuperAdmin-only ones never can).
  const assignable = catalogue.filter((p) => !p.superAdminOnly).length;
  const shownCount = role.hasAllPermissions ? catalogue.length : isOpen ? draft.length : role.permissions.length;
  const total = role.hasAllPermissions ? catalogue.length : assignable;

  const changed = !sameSet(draft, role.permissions);
  const canSave = changed && draft.length > 0 && codeLooksValid(code) && !busy;

  function toggle(key: string) {
    setDraft((current) => (current.includes(key) ? current.filter((k) => k !== key) : [...current, key]));
  }

  function cancel() {
    setDraft(role.permissions);
    setCode("");
    onToggle();
  }

  // Group the catalogue by area, keeping the backend's order.
  const groups = groupByArea(catalogue);

  return (
    <div className="overflow-hidden rounded-2xl border border-c-bd bg-c-sf">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={onToggle}
        className="flex w-full items-center gap-3.5 px-5 py-4 text-left transition hover:bg-c-sf2"
      >
        <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${style.tint}`}>
          <Icon size={19} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium">{role.name}</span>
          <span className="block text-xs text-c-tx2">{style.description}</span>
        </span>
        <span className="hidden flex-col items-end gap-1.5 sm:flex">
          <span className="text-xs text-c-tx2">
            {role.members} member{role.members === 1 ? "" : "s"}
          </span>
          <span className="text-xs">
            {role.hasAllPermissions ? `All ${total}` : `${shownCount} of ${total}`} permissions
          </span>
          <span className="h-1.25 w-24 overflow-hidden rounded-full bg-c-sf2">
            <span className="block h-full bg-c-ac" style={{ width: `${(shownCount / total) * 100}%` }} />
          </span>
        </span>
        <ChevronDown size={18} className={`shrink-0 text-c-tx3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="border-t border-c-bd px-5 pb-5 pt-2">
          {groups.map(([area, permissions]) => (
            <div key={area}>
              <h3 className="mb-1 mt-4 text-[11px] font-medium uppercase tracking-wide text-c-tx3">
                {AREA_LABEL[area] ?? area}
              </h3>
              <ul className="divide-y divide-c-bd">
                {permissions.map((permission) => (
                  <PermissionRow
                    key={permission.key}
                    permission={permission}
                    on={role.hasAllPermissions || draft.includes(permission.key)}
                    // Locked: SuperAdmin-only permissions, and everything on the SuperAdmin card.
                    locked={permission.superAdminOnly || !role.editable}
                    onToggle={() => toggle(permission.key)}
                  />
                ))}
              </ul>
            </div>
          ))}

          {role.editable ? (
            <div className="mt-5 flex flex-col gap-3 border-t border-c-bd pt-4">
              <div className="max-w-xs">
                <CodeField value={code} onChange={setCode} />
              </div>
              <ErrorBox message={error} />
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={!canSave}
                  onClick={() =>
                    run(
                      () => setRolePermissionsAction(role.name, draft, code),
                      () => {
                        setCode("");
                        router.refresh();
                      },
                    )
                  }
                  className={primaryButtonClass}
                >
                  {busy ? "Saving…" : "Save changes"}
                </button>
                <button type="button" disabled={busy} onClick={cancel} className={secondaryButtonClass}>
                  Cancel
                </button>
                <span className="text-xs text-c-tx2">
                  {draft.length === 0
                    ? "A role must keep at least one permission."
                    : changed
                      ? "Unsaved changes. Needs your authenticator code."
                      : "No changes yet."}
                </span>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-xs text-c-tx2">SuperAdmin permissions are fixed.</p>
          )}
        </div>
      )}
    </div>
  );
}

// One permission with its plain-English description and an on/off switch.
function PermissionRow({
  permission,
  on,
  locked,
  onToggle,
}: {
  permission: PermissionInfo;
  on: boolean;
  locked: boolean;
  onToggle: () => void;
}) {
  return (
    <li className={`flex items-center gap-3 py-2.5 ${locked ? "opacity-60" : ""}`}>
      <div className="min-w-0 flex-1">
        <div className="text-[13px]">{permission.description}</div>
        <div className="font-mono text-[11px] text-c-tx3">{permission.key}</div>
      </div>
      {permission.superAdminOnly && <Lock size={14} aria-label="SuperAdmin only" className="shrink-0 text-c-tx2" />}
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={permission.description}
        disabled={locked}
        onClick={onToggle}
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed ${
          on ? "bg-c-ac" : "bg-c-bd2"
        }`}
      >
        <span
          className={`absolute top-0.5 size-4 rounded-full bg-c-sf transition-all ${on ? "left-4.5" : "left-0.5"}`}
        />
      </button>
    </li>
  );
}

// True when both lists hold the same permissions, whatever their order.
function sameSet(a: string[], b: string[]) {
  return a.length === b.length && a.every((item) => b.includes(item));
}

// Splits the catalogue into [area, permissions[]] pairs, in the order the areas first appear.
function groupByArea(catalogue: PermissionInfo[]): [string, PermissionInfo[]][] {
  const groups = new Map<string, PermissionInfo[]>();
  for (const permission of catalogue) {
    groups.set(permission.area, [...(groups.get(permission.area) ?? []), permission]);
  }
  return Array.from(groups.entries());
}
