"use client";

// A row of circles on a line (the "circles on a line" stepper). Steps can be opened in any order; each shows its own state:
// done (filled with a tick), current (ring with a dot), needs info (ring with "!") or pending (grey number).
import type { ReactNode } from "react";

export interface StepInfo {
  label: string;
  complete: boolean;
  // True once the person has opened the step, so an unfinished one can say "Needs info".
  visited: boolean;
}

function stateOf(step: StepInfo, current: boolean): { word: string; circle: ReactNode; circleClass: string; wordClass: string } {
  if (step.complete) return { word: "Completed", circle: "✓", circleClass: "bg-accent text-white", wordClass: "text-accent font-bold" };
  if (current) {
    return { word: "In progress", circle: <span className="h-2.5 w-2.5 rounded-full bg-accent" />, circleClass: "border-2 border-accent bg-white", wordClass: "text-accent font-bold" };
  }
  if (step.visited) return { word: "Needs info", circle: "!", circleClass: "border-2 border-accent bg-white text-accent", wordClass: "text-accent-dark font-bold" };
  return { word: "Pending", circle: null, circleClass: "bg-slate-300 text-white", wordClass: "text-muted" };
}

export function Stepper({ steps, current, onSelect }: { steps: StepInfo[]; current: number; onSelect: (index: number) => void }) {
  return (
    <ol className="grid" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
      {steps.map((step, index) => {
        const state = stateOf(step, index === current);
        const lineFilled = index > 0 && steps[index - 1].complete;
        return (
          <li key={step.label} className="relative">
            {index > 0 && (
              <span
                aria-hidden
                className={`absolute top-[13px] h-0.5 ${lineFilled ? "bg-accent" : "bg-slate-300"}`}
                style={{ left: "calc(-50% + 16px)", right: "calc(50% + 16px)" }}
              />
            )}
            <button
              type="button"
              onClick={() => onSelect(index)}
              aria-current={index === current ? "step" : undefined}
              className="group relative flex w-full flex-col items-center px-1 text-center outline-none"
            >
              <span className={`relative z-10 flex h-[26px] w-[26px] items-center justify-center rounded-full text-[13px] font-bold ${state.circleClass} group-focus-visible:ring-4 group-focus-visible:ring-accent-tint`}>
                {state.circle ?? index + 1}
              </span>
              <span className="mt-2 text-[11px] text-muted">Step {index + 1}</span>
              <span className="text-[13px] font-bold text-heading group-hover:text-accent">{step.label}</span>
              <span className={`mt-0.5 text-[11px] ${state.wordClass}`}>{state.word}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
