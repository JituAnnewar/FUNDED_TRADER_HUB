"use client";

import { RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import type { IntroClock, LabelMap } from "@/components/three/globe-scene";
import { GlobeCanvas } from "@/components/three/lazy-canvas";
import { GLOBE_CITIES, posterXY } from "@/lib/geo/globe";
import { useNow } from "@/lib/hooks/use-now";
import { openMarkets } from "@/lib/sessions";
import { cn } from "@/lib/utils";

const INTRO_SELECTOR = ".intro-warp, .intro-warp i, .intro-globe, .intro-title, .intro-rise, .arc-draw";

/** Restart every CSS intro animation and tell the WebGL globe to fly in again. */
export function replayIntro() {
  delete document.documentElement.dataset.intro;
  document.querySelectorAll<HTMLElement>(INTRO_SELECTOR).forEach((el) => {
    el.getAnimations().forEach((a) => {
      a.cancel();
      a.play();
    });
  });
  window.dispatchEvent(new Event("replay-intro"));
}

export function ReplayIntroButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={replayIntro}
      className={cn(
        "text-muted hover:text-fg inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-colors hover:bg-white/[0.05]",
        className,
      )}
    >
      <RotateCcw className="size-3.5" aria-hidden="true" /> Replay intro
    </button>
  );
}

/** One hero per page, so the intro clock is a module-level object shared with the WebGL scene. */
const INTRO_CLOCK: IntroClock = { t0: 0, skip: false };
/** City label elements, positioned every frame by the WebGL scene. */
const LABELS: LabelMap = {};

const home = GLOBE_CITIES.find((c) => c.id === "home");

/** Poster arcs: only cities on the visible side of the static view. */
const POSTER_ARCS = GLOBE_CITIES.filter((c) => c.id !== "home")
  .map((c) => ({ city: c, p: posterXY(c.lat, c.lon) }))
  .filter((x): x is { city: (typeof GLOBE_CITIES)[number]; p: { x: number; y: number } } => x.p !== null);
const HOME_XY = home ? posterXY(home.lat, home.lon) : null;
const POSTER_POINTS = [...POSTER_ARCS.map((x) => x.p), ...(HOME_XY ? [HOME_XY] : [])];

function arcPath(a: { x: number; y: number }, b: { x: number; y: number }): string {
  // Bulge the control point away from the globe centre so arcs look like they leave the surface.
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = mx - 500;
  const dy = my - 500;
  const len = Math.hypot(dx, dy) || 1;
  const lift = 90 + Math.hypot(a.x - b.x, a.y - b.y) * 0.25;
  return `M${a.x} ${a.y} Q${mx + (dx / len) * lift} ${my + (dy / len) * lift} ${b.x} ${b.y}`;
}

/**
 * The home hero's globe. A static SVG poster plays the intro with CSS straight away
 * (so phones and slow devices still get the animation), then the WebGL globe fades in on top.
 */
export function HeroGlobe({ className }: { className?: string }) {
  const now = useNow();
  const openIds = now === null ? [] : openMarkets(new Date(now)).map((m) => m.id);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const clock = INTRO_CLOCK;
    clock.skip = document.documentElement.dataset.intro === "seen";
    // Fresh page load: the CSS intro started at first paint. Client-side navigation: it starts now.
    const fcp = performance.getEntriesByType("paint").find((e) => e.name === "first-contentful-paint");
    clock.t0 = performance.now() < 4000 && fcp ? fcp.startTime / 1000 : performance.now() / 1000;
    const onReplay = () => {
      clock.skip = false;
      clock.t0 = performance.now() / 1000;
    };
    window.addEventListener("replay-intro", onReplay);
    return () => window.removeEventListener("replay-intro", onReplay);
  }, []);

  return (
    <div className={cn("pointer-events-none", className)} aria-hidden="true">
      {/* Poster, same framing as the WebGL camera (globe ≈ 82% of the box height). */}
      <div
        className={cn(
          "absolute inset-0 grid place-items-center transition-opacity duration-1000",
          ready && "opacity-0",
        )}
      >
        <div className="intro-globe relative aspect-square h-[85%] max-w-full">
          {/* eslint-disable-next-line @next/next/no-img-element -- static SVG, no optimisation needed */}
          <img
            src="/globe-poster.svg"
            alt=""
            className="absolute inset-0 size-full"
            fetchPriority="low"
            decoding="async"
          />
          <svg viewBox="0 0 1000 1000" className="absolute inset-0 size-full overflow-visible">
            <defs>
              <linearGradient id="arc-g" x1="0" x2="1">
                <stop offset="0" stopColor="#A594FF" />
                <stop offset="1" stopColor="#22D3EE" />
              </linearGradient>
            </defs>
            {HOME_XY &&
              POSTER_ARCS.map(({ city, p }, i) => (
                <path
                  key={city.id}
                  d={arcPath(HOME_XY, p)}
                  pathLength={1}
                  fill="none"
                  stroke="url(#arc-g)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  className="arc-draw"
                  style={{ ["--d" as string]: `${2.1 + i * 0.25}s` }}
                />
              ))}
            {POSTER_POINTS.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r="6" fill="#fff" />
            ))}
          </svg>
          {/* Pings are HTML so they animate on the compositor (SVG transforms repaint every frame). */}
          {POSTER_POINTS.map((p, i) => (
            <span
              key={i}
              className="city-ping"
              style={{ left: `${p.x / 10}%`, top: `${p.y / 10}%`, ["--d" as string]: `${i * 0.5}s` }}
            />
          ))}
        </div>
      </div>
      <GlobeCanvas
        className="absolute inset-0"
        openIds={openIds}
        intro={INTRO_CLOCK}
        labels={LABELS}
        onReady={() => setReady(true)}
      />
      {ready && (
        <div className="absolute inset-0 overflow-hidden">
          {GLOBE_CITIES.map((c) => {
            const open = c.id === "home" || openIds.includes(c.id);
            return (
              <div
                key={c.id}
                ref={(el) => {
                  LABELS[c.id] = el;
                }}
                className="bg-surface/80 absolute top-0 left-0 rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-medium tracking-[0.14em] whitespace-nowrap text-white/90 uppercase opacity-0 backdrop-blur-md will-change-transform"
              >
                <span
                  className={cn(
                    "mr-1.5 inline-block size-1.5 rounded-full align-middle",
                    c.id === "home"
                      ? "bg-white"
                      : open
                        ? "bg-accent shadow-[0_0_8px_var(--c-accent)]"
                        : "bg-violet-soft",
                  )}
                />
                {c.label}
                <span className="ml-1.5 text-white/50">{c.id === "home" ? "home" : open ? "open" : "closed"}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
