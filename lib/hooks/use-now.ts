"use client";

import { useSyncExternalStore } from "react";

/**
 * A shared clock that ticks every 15 s. Returns `null` during server render
 * and hydration, so time-dependent UI never causes a hydration mismatch.
 */
const TICK_MS = 15_000;
let current = typeof window === "undefined" ? 0 : Date.now();
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (!timer) {
    current = Date.now();
    timer = setInterval(() => {
      current = Date.now();
      listeners.forEach((l) => l());
    }, TICK_MS);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

export function useNow(): number | null {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => null,
  );
}
