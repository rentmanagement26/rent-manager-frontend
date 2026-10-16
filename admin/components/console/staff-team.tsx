"use client";

import { KeyRound, Plus, ShieldCheck, UserCheck, UserX, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ActionsMenu, type MenuEntry } from "@/components/console/actions-menu";
import { Modal } from "@/components/console/modal";
import { TemporaryPasswordModal } from "@/components/console/temporary-password-modal";
import { TwoFactorResetModal } from "@/components/console/two-factor-reset-modal";
import {
  ErrorBox,
  Notice,
  Pill,
  goToSessionExpired,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/console/ui";
import { formatWhen, initials } from "@/lib/format";
import {
  createStaffAction,
  deactivateStaffAction,
  reactivateStaffAction,
  resetStaffPasswordAction,
  resetStaffTwoFactorAction,
} from "@/lib/staff-actions";
import { ADMIN_ROLES } from "@/lib/types";
import type { ActionFailure, StaffMember, TemporaryPassword } from "@/lib/types";

// What each role is allowed to do, in plain words (the real rules live in the backend).
const ROLE_HELP: Record<string, string> = {
  SuperAdmin: "Everything, including this screen",
  Support: "View landlords and plans, manage overrides, read the audit log",
  Billing: "View landlords, manage plans and the catalog, change a landlord's plan",
};

const STATUS_STYLE: Record<string, string> = {
  Active: "bg-c-ok text-c-okt",
  Invited: "bg-c-wr text-c-wrt", // temporary password not used yet
  Expired: "bg-c-bad text-c-badt", // temporary password ran out
  Disabled: "bg-c-sf2 text-c-tx3",
};

// Which popup is open, and for whom.
type Dialog =
  | { kind: "create" }
  | { kind: "password"; member: StaffMember }
  | { kind: "twofactor"; member: StaffMember }
  | { kind: "deactivate"; member: StaffMember }
  | { kind: "reactivate"; member: StaffMember };

// The Admin team screen: the list of staff accounts and everything a SuperAdmin can do with them.
// Every change goes through a server action (lib/staff-actions.ts), which calls the backend.
export function StaffTeam({ staff, currentUserId }: { staff: StaffMember[]; currentUserId: string }) {
  const router = useRouter();

  const [dialog, setDialog] = useState<Dialog | null>(null);
  // A temporary password to show once, after creating an account or resetting a password.
  const [shownPassword, setShownPassword] = useState<{
    who: string;
    password: TemporaryPassword;
  } | null>(null);

  const close = () => setDialog(null);

  // After a change that worked: close the popup and reload the list.
  function finished() {
    close();
    router.refresh();
  }

  // After an action that returns a temporary password: close, show the password once, reload the list.
  function finishedWithPassword(who: string, password?: TemporaryPassword) {
    finished();
    if (password) setShownPassword({ who, password });
  }

  // What the "Actions" dropdown offers for one staff member. A disabled account can only be reactivated.
  function entriesFor(member: StaffMember): MenuEntry[] {
    if (member.status === "Disabled") {
      return [
        { label: "Reactivate", icon: <UserCheck size={16} />, onSelect: () => setDialog({ kind: "reactivate", member }) },
      ];
    }
    return [
      // Roles have their own page, because picking roles is bigger than a quick popup.
      { label: "Edit roles", icon: <Users size={16} />, onSelect: () => router.push(`/admin-team/${member.userId}/roles`) },
      "separator",
      { label: "Reset password", icon: <KeyRound size={16} />, onSelect: () => setDialog({ kind: "password", member }) },
      {
        label: "Reset two-factor",
        icon: <ShieldCheck size={16} />,
        onSelect: () => setDialog({ kind: "twofactor", member }),
      },
      { label: "Deactivate", icon: <UserX size={16} />, onSelect: () => setDialog({ kind: "deactivate", member }) },
    ];
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-[13px] text-c-tx2">
          {staff.length} staff account{staff.length === 1 ? "" : "s"}
        </p>
        <button
          type="button"
          onClick={() => setDialog({ kind: "create" })}
          className={`${primaryButtonClass} flex items-center gap-1.5`}
        >
          <Plus size={15} /> Add staff
        </button>
      </div>

      {staff.length === 0 ? (
        <Notice>No staff accounts yet.</Notice>
      ) : (
        <ul className="flex flex-col divide-y divide-c-bd">
          {staff.map((member) => {
            const isMe = member.userId === currentUserId;
            return (
              <li key={member.userId} className="flex flex-col gap-3 py-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-c-aci text-xs font-medium text-c-act2">
                    {initials(member.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-medium">{member.name}</span>
                      {isMe && <span className="text-xs text-c-tx3">(you)</span>}
                      <Pill className={STATUS_STYLE[member.status] ?? "bg-c-sf2 text-c-tx"}>{member.status}</Pill>
                    </div>
                    <div className="truncate text-xs text-c-tx2">{member.email ?? "No email"}</div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {member.roles.map((role) => (
                      <Pill key={role} className="bg-c-sf2 text-c-tx">
                        {role}
                      </Pill>
                    ))}
                  </div>
                  {/* You can't change your own account here (the backend refuses it as well). */}
                  {!isMe && <ActionsMenu entries={entriesFor(member)} />}
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pl-0 text-xs text-c-tx3 sm:pl-13">
                  <span>Two-step: {member.twoFactorEnabled ? "on" : "not set up"}</span>
                  <span>Added {formatWhen(member.createdAt)}</span>
                  {member.temporaryPasswordExpiresAt && (
                    <span>Temporary password until {formatWhen(member.temporaryPasswordExpiresAt)}</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {dialog?.kind === "create" && (
        <CreateStaffModal onClose={close} onCreated={(password, name) => finishedWithPassword(name, password)} />
      )}

      {dialog?.kind === "password" && (
        <CodeConfirmModal
          title="Reset password"
          subtitle={dialog.member.name}
          explanation="They get a new temporary password and are signed out everywhere. You will see it once, to pass on to them."
          confirmLabel="Reset password"
          onSubmit={(code) => resetStaffPasswordAction(dialog.member.userId, code)}
          onClose={close}
          onDone={(result) => finishedWithPassword(dialog.member.name, result.password)}
        />
      )}

      {dialog?.kind === "twofactor" && (
        <TwoFactorResetModal
          who={dialog.member.name}
          explanation="Their authenticator is reset and they are signed out everywhere. They get a new temporary password (shown once) and set up two-step again at their next sign-in."
          onSubmit={(reason, note, code) => resetStaffTwoFactorAction(dialog.member.userId, reason, note, code)}
          onClose={close}
          onDone={(result) => finishedWithPassword(dialog.member.name, result.password)}
        />
      )}

      {dialog?.kind === "deactivate" && <DeactivateModal member={dialog.member} onClose={close} onDone={finished} />}

      {dialog?.kind === "reactivate" && (
        <CodeConfirmModal
          title="Reactivate account"
          subtitle={dialog.member.name}
          explanation="They can sign in again."
          confirmLabel="Reactivate"
          onSubmit={(code) => reactivateStaffAction(dialog.member.userId, code)}
          onClose={close}
          onDone={finished}
        />
      )}

      {shownPassword && (
        <TemporaryPasswordModal
          who={shownPassword.who}
          password={shownPassword.password}
          onClose={() => setShownPassword(null)}
        />
      )}
    </>
  );
}

// The "your authenticator code" field that several actions need (proof that it really is the admin acting).
export function CodeField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="staff-code" className="text-xs text-c-tx2">
        Your authenticator code
      </label>
      <input
        id="staff-code"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={7}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="6-digit code"
        className={inputClass}
      />
    </div>
  );
}

export const codeLooksValid = (code: string) => code.replace(/\s/g, "").length >= 6;

// A checkbox per role, with a one-line description of what the role can do.
export function RoleChecks({ selected, onChange }: { selected: string[]; onChange: (roles: string[]) => void }) {
  function toggle(role: string) {
    onChange(selected.includes(role) ? selected.filter((r) => r !== role) : [...selected, role]);
  }

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-xs text-c-tx2">Roles</legend>
      {ADMIN_ROLES.map((role) => (
        <label
          key={role}
          className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-c-bd px-3 py-2.5 hover:bg-c-sf2"
        >
          <input
            type="checkbox"
            checked={selected.includes(role)}
            onChange={() => toggle(role)}
            className="mt-0.5 size-4 accent-c-ac"
          />
          <span>
            <span className="block text-sm font-medium">{role}</span>
            <span className="block text-xs text-c-tx2">{ROLE_HELP[role]}</span>
          </span>
        </label>
      ))}
    </fieldset>
  );
}

// Runs a server action and handles the common outcomes: failure message, expired session, or success.
export function useAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function run<T extends { ok: true }>(action: () => Promise<T | ActionFailure>, onSuccess: (result: T) => void) {
    setBusy(true);
    setError("");
    const result = await action();
    setBusy(false);

    if ("error" in result) {
      if (result.expired) return goToSessionExpired();
      setError(result.error);
      return;
    }
    onSuccess(result);
  }

  return { busy, error, run };
}

// ---- Popups ------------------------------------------------------------------------------------------------

function CreateStaffModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (password: TemporaryPassword, name: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [roles, setRoles] = useState<string[]>([]);
  const [code, setCode] = useState("");
  const { busy, error, run } = useAction();

  const canSubmit = email.trim() && fullName.trim() && roles.length > 0 && codeLooksValid(code) && !busy;

  return (
    <Modal title="Add staff" subtitle="They get a temporary password that works once." busy={busy} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="staff-name" className="text-xs text-c-tx2">
            Full name
          </label>
          <input
            id="staff-name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={inputClass}
          />
          <label htmlFor="staff-email" className="mt-1 text-xs text-c-tx2">
            Work email
          </label>
          <input
            id="staff-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
            className={inputClass}
          />
        </div>

        <RoleChecks selected={roles} onChange={setRoles} />
        <CodeField value={code} onChange={setCode} />
        <ErrorBox message={error} />

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={busy} className={secondaryButtonClass}>
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() =>
              run(
                () => createStaffAction({ email, fullName, roles, code }),
                (result) => onCreated(result.password, fullName.trim()),
              )
            }
            className={primaryButtonClass}
          >
            {busy ? "Creating…" : "Create account"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// A confirm popup that only needs the admin's authenticator code (reset password, reactivate).
function CodeConfirmModal<T extends { ok: true }>({
  title,
  subtitle,
  explanation,
  confirmLabel,
  onSubmit,
  onClose,
  onDone,
}: {
  title: string;
  subtitle: string;
  explanation: string;
  confirmLabel: string;
  onSubmit: (code: string) => Promise<T | ActionFailure>;
  onClose: () => void;
  onDone: (result: T) => void;
}) {
  const [code, setCode] = useState("");
  const { busy, error, run } = useAction();

  return (
    <Modal title={title} subtitle={subtitle} busy={busy} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <p className="text-[13px] text-c-tx2">{explanation}</p>
        <CodeField value={code} onChange={setCode} />
        <ErrorBox message={error} />

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={busy} className={secondaryButtonClass}>
            Cancel
          </button>
          <button
            type="button"
            disabled={!codeLooksValid(code) || busy}
            onClick={() => run(() => onSubmit(code), onDone)}
            className={primaryButtonClass}
          >
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// Deactivating needs no code (the backend does not ask for one), just a confirmation.
function DeactivateModal({
  member,
  onClose,
  onDone,
}: {
  member: StaffMember;
  onClose: () => void;
  onDone: () => void;
}) {
  const { busy, error, run } = useAction();

  return (
    <Modal title="Deactivate account" subtitle={member.name} busy={busy} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <p className="text-[13px] text-c-tx2">
          They are signed out on every device and can&apos;t sign in. You can reactivate the account later. The last
          active SuperAdmin can&apos;t be deactivated.
        </p>
        <ErrorBox message={error} />

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={busy} className={secondaryButtonClass}>
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => run(() => deactivateStaffAction(member.userId), onDone)}
            className={primaryButtonClass}
          >
            {busy ? "Deactivating…" : "Deactivate"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
