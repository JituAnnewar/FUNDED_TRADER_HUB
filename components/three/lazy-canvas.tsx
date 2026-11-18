"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const HeroScene = dynamic(() => import("./hero-scene"), { ssr: false });
const CoinScene = dynamic(() => import("./coin-scene"), { ssr: false });

/**
 * Mounts a 3D scene after first paint, only when:
 * - the visitor has not asked for reduced motion
 * - WebGL is available
 * Rendering pauses while off-screen or when the tab is hidden.
 * The static poster (passed as children) stays underneath, so there is never an empty frame.
 */
function useSceneGate() {
  const ref = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [active, setActive] = useState(false);
  const [lowPower, setLowPower] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let webgl = false;
    try {
      const c = document.createElement("canvas");
      webgl = Boolean(c.getContext("webgl2") ?? c.getContext("webgl"));
    } catch {
      webgl = false;
    }
    if (reduce || !webgl) return;
    const nav = navigator as Navigator & { deviceMemory?: number };
    const low = window.matchMedia("(max-width: 767px)").matches || (nav.deviceMemory ?? 8) <= 4 || (navigator.hardwareConcurrency ?? 8) <= 4;
    // Defer until the browser is idle so the 3D bundle never competes with first paint.
    const idle = (cb: () => void) =>
      "requestIdleCallback" in window ? window.requestIdleCallback(cb, { timeout: 1500 }) : globalThis.setTimeout(cb, 600);
    idle(() => {
      setLowPower(low);
      setEnabled(true);
    });
  }, []);

  useEffect(() => {
    if (!enabled || !ref.current) return;
    let onScreen = true;
    const update = () => setActive(onScreen && document.visibilityState === "visible");
    const io = new IntersectionObserver(([e]) => {
      onScreen = Boolean(e?.isIntersecting);
      update();
    });
    io.observe(ref.current);
    document.addEventListener("visibilitychange", update);
    update();
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, [enabled]);

  return { ref, enabled, active, lowPower };
}

export function HeroCanvas({ className }: { className?: string }) {
  const { ref, enabled, active, lowPower } = useSceneGate();
  return (
    <div ref={ref} className={className}>
      {enabled && (
        <div className="absolute inset-0 animate-[fade-in_1.2s_ease-out_both]">
          <HeroScene active={active} lowPower={lowPower} />
        </div>
      )}
    </div>
  );
}

export function CoinCanvas({ className }: { className?: string }) {
  const { ref, enabled, active } = useSceneGate();
  return (
    <div ref={ref} className={className}>
      {enabled && (
        <div className="absolute inset-0 animate-[fade-in_0.8s_ease-out_both]">
          <CoinScene active={active} spin />
        </div>
      )}
    </div>
  );
}
