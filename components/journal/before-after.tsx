"use client";

import { useState } from "react";

/** Before/after screenshot comparison with a draggable (and keyboard-accessible) divider. */
export function BeforeAfter({ before, after, alt }: { before: string; after: string; alt: string }) {
  const [pos, setPos] = useState(50);
  return (
    <div className="relative overflow-hidden rounded-2xl border border-line select-none">
      {/* eslint-disable-next-line @next/next/no-img-element -- storage images */}
      <img src={after} alt={`${alt} — after`} className="block w-full" />
      <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- storage images */}
        <img src={before} alt={`${alt} — before`} className="block w-full" />
      </div>
      <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-accent shadow-[0_0_12px_var(--c-accent)]" style={{ left: `${pos}%` }} aria-hidden="true" />
      <span className="absolute top-3 left-3 rounded-md bg-bg/80 px-2 py-0.5 text-xs">Before</span>
      <span className="absolute top-3 right-3 rounded-md bg-bg/80 px-2 py-0.5 text-xs">After</span>
      <input
        type="range"
        min={0}
        max={100}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        aria-label="Drag to compare before and after"
        className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
      />
    </div>
  );
}
