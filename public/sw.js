const CACHE = "finance-v5";

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.add("/")).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/")) return;
  if (url.searchParams.has("_rsc")) return; // RSC payloads: dynamic, skip

  const key = url.origin + url.pathname;

  // Static assets are content-hashed and immutable → cache-first
  if (url.pathname.startsWith("/_next/static/")) {
    e.respondWith(
      caches.open(CACHE).then(async cache => {
        const hit = await cache.match(key);
        if (hit) return hit;
        const res = await fetch(e.request);
        if (res.ok) cache.put(key, res.clone());
        return res;
      })
    );
    return;
  }

  // Page navigations → network-first so mutations always reflect on reload.
  // Cache is updated on every successful fetch and used as offline fallback.
  if (e.request.mode === "navigate") {
    e.respondWith(
      caches.open(CACHE).then(async cache => {
        try {
          const res = await fetch(e.request);
          if (res.ok) cache.put(key, res.clone());
          return res;
        } catch {
          return await cache.match(key)
            || await cache.match(`${self.location.origin}/transactions`)
            || await cache.match(`${self.location.origin}/summary`)
            || await cache.match(`${self.location.origin}/`)
            || new Response("Offline", { status: 503 });
        }
      })
    );
    return;
  }

  // Everything else (fonts, manifests, other GETs) → cache-first
  e.respondWith(
    caches.open(CACHE).then(async cache => {
      const hit = await cache.match(key);
      if (hit) return hit;
      try {
        const res = await fetch(e.request);
        if (res.ok) cache.put(key, res.clone());
        return res;
      } catch {
        return new Response("Offline", { status: 503 });
      }
    })
  );
});
