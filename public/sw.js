const CACHE = "finance-v3";

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.add("/")).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);

  if (url.origin !== self.location.origin) return;
  // Auth and API routes always go to network
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/")) return;

  e.respondWith(
    caches.open(CACHE).then(async cache => {
      const hit = await cache.match(e.request);
      if (hit) return hit;
      // Cache miss: fetch from network, cache on success, return
      try {
        const res = await fetch(e.request);
        if (res.ok) cache.put(e.request, res.clone());
        return res;
      } catch {
        // Offline and no cache — return a minimal offline response for navigations
        if (e.request.mode === "navigate") {
          const root = await cache.match("/");
          if (root) return root;
        }
        return new Response("Offline", { status: 503 });
      }
    })
  );
});
