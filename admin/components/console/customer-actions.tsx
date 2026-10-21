"use client";

// The "Actions" dropdown of one customer: View details, and Deactivate / Reactivate account (SuperAdmin only).
// Deactivating asks first, because the person is signed out everywhere right away. Their data is kept.
import { Eye, UserCheck, UserX } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ActionsMenu, type MenuEntry } from "@/components/console/actions-menu";
import { Modal } from "@/components/console/modal";
import { ErrorBox, goToSessionExpired, primaryButtonClass, secondaryButtonClass } from "@/components/console/ui";
import { setCustomerActiveAction } from "@/lib/customer-actions";

interface Props {
  userId: string;
  name: string;
  isActive: boolean;
  // False for roles that can't switch accounts: they only get View details (or no menu on the details page).
  canManage: boolean;
  // Leave out on the details page, where the customer is already open.
  showDetails?: boolean;
}

export function CustomerActions({ userId, name, isActive, canManage, showDetails = true }: Props) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Switches the account, then reloads so the status pill updates.
  async function setActive(active: boolean) {
    setBusy(true);
    setError("");
    const result = await setCustomerActiveAction(userId, active);
    setBusy(false);

    if ("error" in result) {
      if (result.expired) return goToSessionExpired();
      setError(result.error);
      return;
    }
    setConfirming(false);
    router.refresh();
  }

  const entries: MenuEntry[] = [];
  if (showDetails) {
    entries.push({ label: "View details", icon: <Eye size={15} />, onSelect: () => router.push(`/customers/${userId}`) });
  }
  if (canManage) {
    if (showDetails) entries.push("separator");
    entries.push(
      isActive
        ? { label: "Deactivate account", icon: <UserX size={15} />, danger: true, onSelect: () => setConfirming(true) }
        : { label: "Reactivate account", icon: <UserCheck size={15} />, onSelect: () => setActive(true) },
    );
  }
  if (entries.length === 0) return null;

  return (
    <>
      <ActionsMenu entries={entries} />
      {/* A failed reactivate (no popup is open) is shown here. */}
      {!confirming && error && <ErrorBox message={error} />}

      {confirming && (
        <Modal title="Deactivate account" subtitle={name} busy={busy} onClose={() => setConfirming(false)}>
          <div className="flex flex-col gap-4">
            <p className="text-[13px] text-c-tx2">They will be signed out everywhere and can&apos;t sign in. Their data is kept.</p>
            <ErrorBox message={error} />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setConfirming(false)} disabled={busy} className={secondaryButtonClass}>
                Cancel
              </button>
              <button type="button" onClick={() => setActive(false)} disabled={busy} className={primaryButtonClass}>
                {busy ? "Deactivating…" : "Deactivate"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
