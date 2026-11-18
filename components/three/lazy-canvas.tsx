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
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const low = coarse || window.matchMedia("(max-width: 767px)").matches || (nav.deviceMemory ?? 8) <= 4 || (navigator.hardwareConcurrency ?? 8) <= 4;
    let done = false;
    const start = () => {
      if (done) return;
      done = true;
      cleanup();
      setLowPower(low);
      setEnabled(true);
    };
    const events = ["pointerdown", "touchstart", "keydown", "wheel"] as const;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let idleId: number | undefined;
    function cleanup() {
      events.forEach((e) => window.removeEventListener(e, start));
      if (timer) clearTimeout(timer);
      if (idleId !== undefined && "cancelIdleCallback" in window) window.cancelIdleCallback(idleId);
    }
    if (low) {
      // Phones / low-power devices: the 3D bundle waits for the first interaction or 6 s after load,
      // so it never competes with first paint and interactivity. The static poster shows meanwhile.
      events.forEach((e) => window.addEventListener(e, start, { once: true, passive: true }));
      timer = setTimeout(start, 6000);
    } else if ("requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(start, { timeout: 1500 });
    } else {
      timer = setTimeout(start, 600);
    }
    return cleanup;
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
