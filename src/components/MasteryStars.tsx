"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  toolCardId: string;
  /** Lit stars (1–3). First seen = 1. */
  filled?: number;
};

/** Figma star path (blob-rounded). Grey = empty, yellow = earned. */
const STAR_PATH =
  "M 167.2 71.3 Q 180 56 192.8 71.3 L 220.5 104.5 Q 228.2 113.7 239.3 118.1 L 279.4 134.2 Q 297.9 141.7 287.3 158.6 L 264.4 195.2 Q 258 205.3 257.2 217.3 L 254.2 260.4 Q 252.9 280.3 233.5 275.4 L 191.6 264.9 Q 180 262 168.4 264.9 L 126.5 275.4 Q 107.1 280.3 105.8 260.4 L 102.8 217.3 Q 102 205.3 95.6 195.2 L 72.7 158.6 Q 62.1 141.7 80.6 134.2 L 120.7 118.1 Q 131.8 113.7 139.5 104.5 Z";

function Star({ on, celebrate }: { on: boolean; celebrate: boolean }) {
  return (
    <svg
      className={celebrate ? "lt-star lt-star-earn rise-shake" : "lt-star"}
      data-on={on ? "true" : "false"}
      viewBox="62 56 236 224"
      aria-hidden="true"
      focusable="false"
    >
      <path d={STAR_PATH} />
    </svg>
  );
}

/** Personal mastery only — not a social upvote. */
export function MasteryStars({ toolCardId, filled = 1 }: Props) {
  const lit = Math.min(3, Math.max(0, filled));
  const prevFilled = useRef<number | null>(null);
  const [celebrating, setCelebrating] = useState<Set<number>>(() => new Set());

  useEffect(() => {
    prevFilled.current = null;
    setCelebrating(new Set());
  }, [toolCardId]);

  useEffect(() => {
    const prev = prevFilled.current;
    prevFilled.current = lit;

    const gained = new Set<number>();
    if (prev === null) {
      for (let n = 1; n <= lit; n += 1) gained.add(n);
    } else if (lit > prev) {
      for (let n = prev + 1; n <= lit; n += 1) gained.add(n);
    }

    if (gained.size === 0) return;
    setCelebrating(gained);
    const t = window.setTimeout(() => setCelebrating(new Set()), 2600);
    return () => window.clearTimeout(t);
  }, [lit, toolCardId]);

  return (
    <div className="flex flex-col items-end gap-1">
      <div
        className="lt-stars"
        role="img"
        aria-label={`${lit} of 3 mastery stars`}
        title="Your mastery on this skill"
      >
        {[1, 2, 3].map((n) => (
          <Star
            key={`${toolCardId}-${n}`}
            on={n <= lit}
            celebrate={celebrating.has(n)}
          />
        ))}
      </div>
    </div>
  );
}
