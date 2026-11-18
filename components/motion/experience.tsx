"use client";

import Lenis from "lenis";
import { useEffect, useRef } from "react";

/**
 * Site-wide motion extras, mounted once in the public layout:
 * - Lenis smooth scroll (off under reduced motion and on touch devices)
 * - Custom cursor + magnetic buttons (fine pointers only; add `data-magnetic` to an element)
 */
export function Experience() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(pointer: fine)").matches;
    const cleanups: (() => void)[] = [];

    if (!reduce && fine) {
      const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
      let raf = 0;
      const loop = (t: number) => {
        lenis.raf(t);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
      cleanups.push(() => {
        cancelAnimationFrame(raf);
        lenis.destroy();
      });
    }

    if (fine && !reduce && dot.current && ring.current) {
      const d = dot.current;
      const r = ring.current;
      document.documentElement.classList.add("has-cursor");
      let x = -100;
      let y = -100;
      let rx = -100;
      let ry = -100;
      let raf = 0;
      let hovering = false;
      const onMove = (e: PointerEvent) => {
        x = e.clientX;
        y = e.clientY;
        const target = e.target instanceof Element ? e.target.closest("a,button,[role=button],input,select,textarea,[data-magnetic]") : null;
        hovering = Boolean(target);
      };
      const tick = () => {
        rx += (x - rx) * 0.18;
        ry += (y - ry) * 0.18;
        d.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
        r.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%) scale(${hovering ? 1.8 : 1})`;
        r.style.borderColor = hovering ? "rgb(41 212 255 / 0.8)" : "rgb(255 255 255 / 0.35)";
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      window.addEventListener("pointermove", onMove, { passive: true });

      // Magnetic elements
      const onMagnet = (e: PointerEvent) => {
        const el = e.target instanceof Element ? (e.target.closest("[data-magnetic]") as HTMLElement | null) : null;
        document.querySelectorAll<HTMLElement>("[data-magnetic]").forEach((m) => {
          if (m !== el) m.style.transform = "";
        });
        if (!el) return;
        const b = el.getBoundingClientRect();
        const mx = (e.clientX - (b.left + b.width / 2)) * 0.25;
        const my = (e.clientY - (b.top + b.height / 2)) * 0.35;
        el.style.transform = `translate(${mx}px, ${my}px)`;
      };
      window.addEventListener("pointermove", onMagnet, { passive: true });

      cleanups.push(() => {
        cancelAnimationFrame(raf);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointermove", onMagnet);
        document.documentElement.classList.remove("has-cursor");
      });
    }

    return () => cleanups.forEach((c) => c());
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[90] hidden [@media(pointer:fine)]:block motion-reduce:!hidden">
      <div ref={dot} className="absolute top-0 left-0 size-1.5 rounded-full bg-accent shadow-[0_0_12px_var(--c-accent)]" />
      <div
        ref={ring}
        className="absolute top-0 left-0 size-8 rounded-full border border-white/35 transition-[border-color,scale] duration-200"
      />
    </div>
  );
}
