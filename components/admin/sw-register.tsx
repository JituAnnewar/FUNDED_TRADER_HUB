"use client";

import { useEffect } from "react";

/** Registers the minimal service worker so the admin can be installed as an app. */
export function SwRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator && window.location.protocol === "https:") {
      navigator.serviceWorker.register("/sw.js", { scope: "/admin" }).catch(() => undefined);
    }
  }, []);
  return null;
}
