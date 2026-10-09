import Image from "next/image";
import type { ReactNode } from "react";

// The centered sign-in card used by every step of the admin sign-in.
export function AuthCard({ step, children }: { step: 1 | 2; children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[radial-gradient(circle_at_20%_10%,rgba(232,44,44,0.06),transparent_40%),radial-gradient(circle_at_85%_90%,rgba(232,44,44,0.05),transparent_40%)]">
      <main className="flex flex-1 items-center justify-center px-5 py-8">
        <div className="animate-rise w-full max-w-110 rounded-[20px] border border-line bg-surface px-6 pb-7 pt-8 shadow-card sm:px-9">
          <Image
            src="/domuspro-logo.png"
            alt="DomusPRO"
            width={200}
            height={67}
            priority
            className="mx-auto mb-6 h-auto w-42.5 sm:w-50"
          />
          <Stepper step={step} />
          {children}
        </div>
      </main>
      <footer className="flex flex-wrap justify-center gap-5 px-5 pb-6 text-xs text-ink-3">
        <span>Authorised staff only</span>
        <span>© {new Date().getFullYear()} DomusPRO</span>
      </footer>
    </div>
  );
}

function Stepper({ step }: { step: 1 | 2 }) {
  const dot = (n: 1 | 2, label: string) => {
    const done = step > n;
    const active = step === n;
    return (
      <div className={`flex items-center gap-2 text-xs ${active ? "font-medium text-ink" : "text-ink-3"}`}>
        <span
          className={`flex size-5.5 items-center justify-center rounded-full border text-[11px] ${
            active
              ? "border-brand bg-brand text-brand-on"
              : done
                ? "border-brand-tint bg-brand-tint text-brand-text"
                : "border-line-2"
          }`}
        >
          {done ? "✓" : n}
        </span>
        {label}
      </div>
    );
  };

  return (
    <div className="mb-6 flex items-center gap-2.5">
      {dot(1, "Sign in")}
      <div className="relative h-0.5 flex-1 overflow-hidden rounded bg-line">
        <div
          className="absolute inset-y-0 left-0 bg-brand transition-[width] duration-700"
          style={{ width: step === 2 ? "100%" : "0%" }}
        />
      </div>
      {dot(2, "Verify")}
    </div>
  );
}
