import { useId } from "react";

// The DomusPRO loading indicator: a house inside a ring, with an orange arc that keeps circling it.
// Use it anywhere something is loading. `size` is in pixels. It is drawn as an SVG, so it stays sharp at any size.
// The motion is switched off for people who ask their device to reduce motion (the arc just sits still).
export function HouseLoader({ size = 96, label = "Loading" }: { size?: number; label?: string }) {
  // Gradient ids must be unique per loader, or two loaders on one page would share (and clash on) the same ids.
  const id = useId();

  return (
    <span role="status" aria-label={label} className="inline-block" style={{ width: size, height: size }}>
      <svg viewBox="0 0 200 200" width={size} height={size} aria-hidden="true" className="relative block">
        <defs>
          <linearGradient id={`${id}-arc`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ff5a00" />
            <stop offset="1" stopColor="#ffa30f" />
          </linearGradient>
          <linearGradient id={`${id}-roof`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffa30f" />
            <stop offset="0.55" stopColor="#ff7a00" />
            <stop offset="1" stopColor="#e04a00" />
          </linearGradient>
          <linearGradient id={`${id}-win`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffa30f" />
            <stop offset="1" stopColor="#f0560a" />
          </linearGradient>
        </defs>

        {/* The faint full ring behind the moving arc. */}
        <circle cx="100" cy="100" r="82" fill="none" stroke="#fde3c8" strokeWidth="9" />

        {/* The house: chimney, walls, roof, then the four windows. */}
        <rect x="117" y="70" width="13" height="27" rx="3" fill="#e8560a" />
        <path
          d="M 71 99 L 100 75 L 129 99 V 128 a 4 4 0 0 1 -4 4 H 75 a 4 4 0 0 1 -4 -4 Z"
          fill="#faf9f7"
          stroke="#eeebe6"
          strokeWidth="1.5"
        />
        <path
          d="M 66 99 L 100 69 L 134 99"
          fill="none"
          stroke={`url(#${id}-roof)`}
          strokeWidth="11"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {[
          [88, 96],
          [101, 96],
          [88, 109],
          [101, 109],
        ].map(([x, y], i) => (
          <rect
            key={i}
            x={x}
            y={y}
            width="11"
            height="11"
            rx="2"
            fill={`url(#${id}-win)`}
            // The windows glow one after another, which makes the house feel alive while it waits.
            className="animate-pulse motion-reduce:animate-none"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </svg>

      {/* The moving arc is its own layer on top, so only it spins. */}
      <svg
        viewBox="0 0 200 200"
        width={size}
        height={size}
        aria-hidden="true"
        className="pointer-events-none relative block animate-spin motion-reduce:animate-none"
        style={{ marginTop: -size, animationDuration: "1.4s" }}
      >
        <circle
          cx="100"
          cy="100"
          r="82"
          fill="none"
          stroke={`url(#${id}-arc)`}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray="165 351"
        />
      </svg>
    </span>
  );
}
