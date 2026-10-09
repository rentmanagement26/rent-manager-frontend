"use client";

import { useEffect, useRef } from "react";

// Counts from 0 to `value` once on mount. Writes straight to the DOM node so it needs no state.
export function CountUp({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      node.textContent = value.toLocaleString("en-CA");
      return;
    }

    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / 1000, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      node.textContent = Math.round(value * eased).toLocaleString("en-CA");
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  // The real number is the server-rendered text, so it also reads correctly with scripts off.
  return <span ref={ref}>{value.toLocaleString("en-CA")}</span>;
}
