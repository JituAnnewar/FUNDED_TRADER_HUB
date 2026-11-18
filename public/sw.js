// Minimal service worker: makes the admin installable and shows an offline notice.
// It does not cache pages, so data is never stale.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;
  event.respondWith(
    fetch(event.request).catch(
      () =>
        new Response(
          '<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="background:#05070A;color:#E8EDF4;font-family:system-ui;display:grid;place-items:center;height:100vh;margin:0"><p>You are offline. Reconnect to update your journal.</p></body>',
          { headers: { "content-type": "text/html" } },
        ),
    ),
  );
});
