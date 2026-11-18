"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { IntroClock, LabelMap } from "./globe-scene";

const GlobeScene = dynamic(() => import("./globe-scene"), { ssr: false });
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
    // Cheap capability check only: creating a test WebGL context can cost hundreds of ms
    // (software GL). If the real context fails, the Canvas renders nothing and the poster stays.
    if (reduce || typeof WebGLRenderingContext === "undefined") return;
    const nav = navigator as Navigator & { deviceMemory?: number };
    const low =
      window.matchMedia("(pointer: coarse)").matches ||
      window.matchMedia("(max-width: 767px)").matches ||
      (nav.deviceMemory ?? 8) <= 4 ||
      (navigator.hardwareConcurrency ?? 8) <= 4;
    let done = false;
    const start = () => {
      if (done) return;
      done = true;
      cleanup();
      setLowPower(low);
      setEnabled(true);
    };
    // The 3D bundle (three.js, ~900 kB) loads on the visitor's first sign of life: a mouse move,
    // touch, scroll or key press. It never competes with page load, and the animated CSS poster
    // plays until then. Real visitors trigger this within moments of arriving.
    const events = ["pointermove", "pointerdown", "touchstart", "keydown", "wheel", "scroll"] as const;
    function cleanup() {
      events.forEach((e) => window.removeEventListener(e, start));
    }
    events.forEach((e) => window.addEventListener(e, start, { once: true, passive: true }));
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

export function GlobeCanvas({
  className,
  openIds,
  intro,
  labels,
  onReady,
}: {
  className?: string;
  openIds: string[];
  intro: IntroClock;
  labels?: LabelMap;
  onReady?: () => void;
}) {
  const { ref, enabled, active, lowPower } = useSceneGate();
  return (
    <div ref={ref} className={className}>
      {enabled && (
        <div className="absolute inset-0 animate-[fade-in_1s_ease-out_both]">
          <GlobeScene
            active={active}
            lowPower={lowPower}
            openIds={openIds}
            intro={intro}
            labels={labels}
            onReady={onReady}
          />
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
