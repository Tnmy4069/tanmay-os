/**
 * Service worker script body. CACHE embeds a build id so each deploy
 * produces a byte-different worker and browsers pick up the update.
 */
export function buildServiceWorkerScript(version: string): string {
  const cache = `tanmay-os-offline-${version}`;
  return `/* tanmay-os sw ${version} */
const CACHE = ${JSON.stringify(cache)};
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

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const raw = event.notification.data && event.notification.data.url;
  const path = typeof raw === "string" ? raw : "/today";
  const url = new URL(path, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (clientList) => {
      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin) && "focus" in client) {
          await client.focus();
          if ("navigate" in client && typeof client.navigate === "function") {
            try {
              await client.navigate(url);
              return;
            } catch {
              // fall through
            }
          }
          client.postMessage({ type: "NOTIFICATION_NAV", url: path });
          return;
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/api/auth") || url.pathname.startsWith("/auth")) return;
  if (url.pathname.startsWith("/api/sync")) return;
  // Never cache the worker itself
  if (url.pathname === "/sw.js") return;

  // HTML navigations: network-first so deploys show up immediately
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

  // Next.js build assets: network-first (hashed URLs, but avoid sticky stale)
  if (url.pathname.startsWith("/_next/")) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Icons / static media: cache-first
  event.respondWith(
    caches.match(req).then((cached) => {
      const fresh = fetch(req)
        .then((res) => {
          if (
            res.ok &&
            (url.pathname.startsWith("/pwa-icon/") ||
              url.pathname.match(/\\.(js|css|woff2|png|svg|webp|ico)$/) ||
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
`;
}

export function resolveSwVersion(): string {
  const sha =
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
    process.env.VERCEL_DEPLOYMENT_ID ||
    process.env.NEXT_PUBLIC_BUILD_ID;
  if (sha) return String(sha).slice(0, 12);
  // Local / non-Vercel: stable so SW doesn't thrash every request
  return "local";
}
