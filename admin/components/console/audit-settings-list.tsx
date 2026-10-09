"use client";

import { Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Pill, cardClass, goToSessionExpired } from "@/components/console/ui";
import { removeAuditOverrideAction, setAuditModeAction } from "@/lib/audit-actions";
import type { AuditMode, AuditOverride, AuditSettingItem } from "@/lib/types";

const MODES: { mode: AuditMode; label: string }[] = [
  { mode: "Disabled", label: "Off" },
  { mode: "Summary", label: "Summary" },
  { mode: "Full", label: "Full" },
];

function ModeToggle({
  value,
  disabled,
  lockedOff,
  onChange,
  label,
}: {
  value: AuditMode | null;
  disabled: boolean;
  lockedOff: boolean;
  onChange: (mode: AuditMode) => void;
  label: string;
}) {
  const activeIndex = MODES.findIndex((m) => m.mode === value);

  return (
    <div role="group" aria-label={label} className="relative grid w-60 shrink-0 grid-cols-3 rounded-[10px] bg-c-sf2 p-0.75">
      {activeIndex >= 0 && (
        <div
          aria-hidden
          className="absolute inset-y-0.75 left-0.75 w-[calc((100%-6px)/3)] rounded-lg bg-c-sf transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ transform: `translateX(${activeIndex * 100}%)` }}
        />
      )}
      {MODES.map(({ mode, label: text }) => {
        const blocked = disabled || (lockedOff && mode === "Disabled");
        return (
          <button
            key={mode}
            type="button"
            aria-pressed={mode === value}
            disabled={blocked}
            onClick={() => mode !== value && onChange(mode)}
            className={`relative z-10 rounded-lg py-1.5 text-center text-[13px] disabled:cursor-not-allowed disabled:opacity-50 ${
              mode === value ? "font-medium text-c-tx" : "text-c-tx2 enabled:hover:text-c-tx"
            }`}
          >
            {text}
          </button>
        );
      })}
    </div>
  );
}

export function AuditSettingsList({
  actions,
  overrides,
  canManage,
}: {
  actions: AuditSettingItem[];
  overrides: AuditOverride[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [refreshing, startTransition] = useTransition();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; error: boolean } | null>(null);

  const overrideByKey = new Map(overrides.map((o) => [o.key.toLowerCase(), o]));

  const modules = new Map<string, AuditSettingItem[]>();
  for (const action of actions) {
    modules.set(action.module, [...(modules.get(action.module) ?? []), action]);
  }
  const moduleNames = [...modules.keys()].sort();

  async function run(key: string, task: () => ReturnType<typeof setAuditModeAction>, success: string) {
    setBusyKey(key);
    setToast(null);
    const result = await task();
    setBusyKey(null);

    if ("error" in result) {
      if (result.expired) goToSessionExpired();
      else setToast({ text: result.error, error: true });
      return;
    }
    setToast({ text: success, error: false });
    startTransition(() => router.refresh());
  }

  const change = (key: string, mode: AuditMode) =>
    run(key, () => setAuditModeAction(key, mode), `${key} set to ${MODES.find((m) => m.mode === mode)?.label}`);
  const reset = (key: string) => run(key, () => removeAuditOverrideAction(key), `${key} back to default`);

  const busy = busyKey !== null || refreshing;

  return (
    <div className="flex flex-col gap-4">
      {!canManage && (
        <p className="rounded-xl bg-c-sf2 px-4 py-3 text-[13px] text-c-tx2">
          You can view these settings, but only a SuperAdmin can change them.
        </p>
      )}

      <div aria-live="polite" className="min-h-6 text-[13px]">
        {toast && <span className={toast.error ? "text-c-badt" : "text-c-okt"}>{toast.text}</span>}
      </div>

      {moduleNames.map((moduleName) => {
        const rows = [...(modules.get(moduleName) ?? [])].sort((a, b) => a.action.localeCompare(b.action));
        const moduleOverride = overrideByKey.get(moduleName.toLowerCase());

        return (
          <section key={moduleName} className={cardClass}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-c-bd pb-4">
              <div>
                <h2 className="text-base font-medium capitalize">{moduleName}</h2>
                <p className="mt-0.75 text-[13px] text-c-tx2">
                  {moduleOverride
                    ? "One setting for every action here, unless an action has its own."
                    : "Each action uses its default unless you set it."}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {moduleOverride && canManage && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => reset(moduleName.toLowerCase())}
                    className="text-[13px] text-c-act2 hover:underline disabled:opacity-50"
                  >
                    Reset module
                  </button>
                )}
                <ModeToggle
                  label={`${moduleName} module`}
                  value={moduleOverride?.mode ?? null}
                  disabled={!canManage || busy}
                  lockedOff={false}
                  onChange={(mode) => change(moduleName.toLowerCase(), mode)}
                />
              </div>
            </div>

            {rows.map((row) => {
              const own = overrideByKey.get(row.action.toLowerCase());
              const changed = row.mode !== row.defaultMode;
              return (
                <div
                  key={row.action}
                  className="flex flex-wrap items-center justify-between gap-3 border-t border-c-bd py-4 first:border-t-0 first:pt-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-medium">{row.action}</p>
                    <p className="mt-0.75 flex flex-wrap items-center gap-2 text-[13px] text-c-tx2">
                      {row.entriesLast30Days.toLocaleString("en-CA")} events in 30 days
                      {row.isProtected && (
                        <span className="inline-flex items-center gap-1 text-c-tx3">
                          <Lock size={12} /> Protected, always recorded
                        </span>
                      )}
                      {changed && <Pill className="bg-c-wr text-c-wrt">Changed from default</Pill>}
                      {!own && row.controlledBy === "module" && <Pill className="bg-c-sf2 text-c-tx2">Set by module</Pill>}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {own && canManage && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => reset(row.action.toLowerCase())}
                        className="text-[13px] text-c-act2 hover:underline disabled:opacity-50"
                      >
                        Reset
                      </button>
                    )}
                    <ModeToggle
                      label={row.action}
                      value={row.mode}
                      disabled={!canManage || busy}
                      lockedOff={row.isProtected}
                      onChange={(mode) => change(row.action.toLowerCase(), mode)}
                    />
                  </div>
                </div>
              );
            })}
          </section>
        );
      })}
    </div>
  );
}
