const CACHE = "tanmay-os-offline-v1";
const PRECACHE = [
  "/",
  "/login",
  "/dashboard",
  "/today",
  "/tasks",
  "/settings",
  "/manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE).catch(() => undefined))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Never cache auth endpoints
  if (url.pathname.startsWith("/api/auth") || url.pathname.startsWith("/auth")) return;

  // Sync APIs should always hit network when possible
  if (url.pathname.startsWith("/api/sync")) return;

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(async () => {
          const exact = await caches.match(req);
          if (exact) return exact;
          const dash = await caches.match("/dashboard");
          if (dash) return dash;
          const login = await caches.match("/login");
          if (login) return login;
          return caches.match("/");
        })
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      const fresh = fetch(req)
        .then((res) => {
          if (
            res.ok &&
            (url.pathname.startsWith("/pwa-icon/") ||
              url.pathname.match(/\.(js|css|woff2|png|svg|webp|ico)$/) ||
              url.pathname === "/manifest.webmanifest")
          ) {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || fresh;
    })
  );
});
