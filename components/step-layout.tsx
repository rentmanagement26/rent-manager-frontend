// Page layout for one step of a stepper: the step on the left (an icon, a title, a one-line intro and the form) and a guide on the right
// that says what to do in this step. The guide sits under the step on small screens.
import type { ReactNode } from "react";

export interface GuideInfo {
  // What to do, in order.
  steps: string[];
  // One extra thing worth knowing, for example a legal point. Optional.
  note?: string;
}

// A few outline icons (24x24 paths) so steps look alike across screens.
export const STEP_ICONS = {
  home: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  file: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  list: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
  check: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  pen: "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z",
  eye: "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
  mail: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
} as const;

export function StepLayout({
  icon,
  title,
  intro,
  guide,
  children,
}: {
  icon: keyof typeof STEP_ICONS;
  title: string;
  intro: string;
  guide: GuideInfo;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <section className="rounded-2xl border border-default bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-tint text-accent">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={STEP_ICONS[icon]} />
            </svg>
          </span>
          <div>
            <h2 className="font-head text-lg font-bold text-heading">{title}</h2>
            <p className="mt-0.5 text-sm text-muted">{intro}</p>
          </div>
        </div>
        {children}
      </section>

      <aside className="h-fit rounded-2xl border border-accent/30 bg-accent-tint/60 p-5 lg:sticky lg:top-4">
        <p className="text-xs font-bold uppercase tracking-wide text-accent-dark">What to do</p>
        <ol className="mt-3 space-y-3">
          {guide.steps.map((text, index) => (
            <li key={text} className="flex gap-3 text-sm text-heading">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-white">{index + 1}</span>
              <span>{text}</span>
            </li>
          ))}
        </ol>
        {guide.note && <p className="mt-4 rounded-lg bg-white/80 px-3 py-2.5 text-xs text-body">{guide.note}</p>}
      </aside>
    </div>
  );
}
