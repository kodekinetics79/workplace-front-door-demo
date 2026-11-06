// Low-bandwidth support: the service directory and visited pages stay readable without signal.
const CACHE = "wp-v1";
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(["/", "/services", "/help"]).catch(() => {}))); self.skipWaiting(); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))); self.clients.claim(); });
self.addEventListener("fetch", (e) => {
  const req = e.request; const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin || url.pathname.startsWith("/staff") || url.pathname.startsWith("/api/staff") || url.pathname.startsWith("/api/auth")) return;
  if (url.pathname.startsWith("/_next/static/")) { e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => { const c = res.clone(); caches.open(CACHE).then((x) => x.put(req, c)); return res; }))); return; }
  if (req.mode === "navigate" || url.pathname === "/api/services") {
    e.respondWith(fetch(req).then((res) => { if (res.ok) { const c = res.clone(); caches.open(CACHE).then((x) => x.put(req, c)); } return res; }).catch(() => caches.match(req).then((hit) => hit || caches.match("/"))));
  }
});
