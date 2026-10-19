"use client";

// The "Versions" button on a plan card and the popup it opens: every version the plan has had, newest first.

import { useEffect, useState } from "react";
import { Modal } from "@/components/console/modal";
import { ErrorBox, Pill, goToSessionExpired, secondaryButtonClass } from "@/components/console/ui";
import { formatPrice, formatWhen } from "@/lib/format";
import { loadPlanVersionsAction } from "@/lib/package-actions";
import type { AdminPackageDetail } from "@/lib/types";

// Loads the history when the popup opens (not with the page), because most visits never look at it.
function VersionsModal({ packageId, planName, onClose }: { packageId: number; planName: string; onClose: () => void }) {
  const [detail, setDetail] = useState<AdminPackageDetail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    loadPlanVersionsAction(packageId).then((result) => {
      if (cancelled) return;
      if ("error" in result) {
        if (result.expired) return goToSessionExpired();
        setError(result.error);
        return;
      }
      setDetail(result.data);
    });
    // Ignore the answer if the popup was closed before it arrived.
    return () => {
      cancelled = true;
    };
  }, [packageId]);

  return (
    <Modal title="Versions" subtitle={planName} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <ErrorBox message={error} />
        {!detail && !error && <p className="text-[13px] text-c-tx3">Loading…</p>}

        {detail?.versions.map((v) => (
          <article key={v.packageVersionId} className="rounded-xl bg-c-sf2 px-4 py-3 text-[13px]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-2 font-medium">
                Version {v.version}
                {v.isCurrent && <Pill className="bg-c-ok text-c-okt">Current</Pill>}
              </span>
              <span className="text-xs text-c-tx3">{formatWhen(v.createdAt)}</span>
            </div>
            <p className="mt-1 text-c-tx2">
              {formatPrice(v.monthlyPrice)} / month · {v.landlords} {v.landlords === 1 ? "landlord" : "landlords"}
            </p>
            {v.limits.length > 0 && (
              <p className="mt-2 text-c-tx2">{v.limits.map((l) => `${l.displayName}: ${l.value}`).join(" · ")}</p>
            )}
            <p className="mt-1 text-c-tx2">
              {v.features.length > 0 ? v.features.map((f) => f.displayName).join(", ") : "No extra features"}
            </p>
          </article>
        ))}

        <div className="flex justify-end">
          <button type="button" onClick={onClose} className={secondaryButtonClass}>
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}

// Shown on every plan card, for every role that can see plans.
export function PlanVersionsButton({ packageId, planName }: { packageId: number; planName: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="self-start text-[13px] text-c-act2 hover:underline">
        Versions
      </button>
      {open && <VersionsModal packageId={packageId} planName={planName} onClose={() => setOpen(false)} />}
    </>
  );
}
