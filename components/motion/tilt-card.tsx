"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * 3D tilt on hover with a moving glare. Pure CSS variables updated on pointer move (no animation library).
 * Mouse only; disabled under reduced motion via CSS.
 */
export function TiltCard({ children, className, max = 8 }: { children: React.ReactNode; className?: string; max?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef(0);

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse") return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      el.style.setProperty("--rx", `${(-(py - 0.5) * max * 2).toFixed(2)}deg`);
      el.style.setProperty("--ry", `${((px - 0.5) * max * 2).toFixed(2)}deg`);
      el.style.setProperty("--gx", `${(px * 100).toFixed(1)}%`);
      el.style.setProperty("--gy", `${(py * 100).toFixed(1)}%`);
    });
  }
  function onLeave() {
    const el = ref.current;
    if (!el) return;
    cancelAnimationFrame(frame.current);
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  }

  return (
    <div style={{ perspective: 900 }} className={cn("h-full", className)}>
      <div ref={ref} onPointerMove={onMove} onPointerLeave={onLeave} className="tilt group/tilt relative h-full">
        {children}
        <div aria-hidden="true" className="tilt-glare pointer-events-none absolute inset-0 rounded-[1rem] opacity-0 transition-opacity duration-300 group-hover/tilt:opacity-100" />
      </div>
    </div>
  );
}
