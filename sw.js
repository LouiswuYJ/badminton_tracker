const CACHE = "badminton";

// Activate new versions immediately instead of waiting for all tabs to close
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

// Network-first: always fetch the latest when online, fall back to cache offline
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;

  const sameOrigin = new URL(e.request.url).origin === self.location.origin;
  // Same-origin files bypass the HTTP cache so deploys show up right away
  // (fetch by URL: a navigate-mode Request can't be re-created with options)
  const fetched = sameOrigin ? fetch(e.request.url, { cache: "no-cache" }) : fetch(e.request);

  e.respondWith(
    fetched
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
