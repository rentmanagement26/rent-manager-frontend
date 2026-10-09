"use client";

import { useRef } from "react";

// Six single-digit boxes that behave like one field: auto-advance, paste, backspace, auto-submit.
// The combined value is posted as the hidden "code" input.
export function CodeBoxes({ invalid = false }: { invalid?: boolean }) {
  const boxes = useRef<(HTMLInputElement | null)[]>([]);
  const hidden = useRef<HTMLInputElement>(null);

  function sync() {
    const value = boxes.current.map((b) => b?.value ?? "").join("");
    if (hidden.current) hidden.current.value = value;
    if (value.length === 6) hidden.current?.form?.requestSubmit();
  }

  function fill(text: string) {
    const digits = text.replace(/\D/g, "").slice(0, 6);
    digits.split("").forEach((digit, i) => {
      const box = boxes.current[i];
      if (box) box.value = digit;
    });
    boxes.current[Math.min(digits.length, 5)]?.focus();
    sync();
  }

  return (
    <div>
      <input ref={hidden} type="hidden" name="code" />
      <div className={`grid grid-cols-6 gap-2.5 ${invalid ? "animate-shake" : ""}`}>
        {Array.from({ length: 6 }, (_, i) => (
          <input
            key={i}
            ref={(el) => {
              boxes.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            maxLength={1}
            autoFocus={i === 0}
            placeholder="·"
            aria-label={`Digit ${i + 1}`}
            onChange={(event) => {
              const box = event.currentTarget;
              box.value = box.value.replace(/\D/g, "");
              if (box.value && i < 5) boxes.current[i + 1]?.focus();
              sync();
            }}
            onKeyDown={(event) => {
              if (event.key === "Backspace" && !event.currentTarget.value && i > 0) boxes.current[i - 1]?.focus();
            }}
            onPaste={(event) => {
              event.preventDefault();
              fill(event.clipboardData.getData("text"));
            }}
            className={`h-14 w-full rounded-xl border bg-bg text-center text-[22px] font-medium text-ink outline-none transition placeholder:text-ink-3 focus:-translate-y-0.5 focus:bg-surface focus:ring-3 focus:ring-brand-tint ${
              invalid ? "border-alert-text" : "border-line-2 focus:border-brand"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
