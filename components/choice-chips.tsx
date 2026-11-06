"use client";

// A row of round buttons for picking from a short list. The parent decides whether one or several can be chosen (it handles onToggle).
import type { Option } from "@/lib/maintenance-format";

export function ChoiceChips({
  options,
  selected,
  onToggle,
  label,
}: {
  options: Option[];
  selected: string[];
  onToggle: (value: string) => void;
  // Read out by screen readers for the whole group.
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((option) => {
        const on = selected.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={on}
            onClick={() => onToggle(option.value)}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
              on ? "border-accent bg-accent text-white" : "border-default bg-white text-heading hover:bg-subtle"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
