// Service worker HMD: halaman tamu (/t/…) network-first dengan cadangan cache,
// aset build Next (/_next/static) cache-first.
// F2: layar pintu panitia (/panitia/event/{id}/scan[/cari]) juga network-first supaya bisa dibuka
// ulang tanpa sinyal. HTML-nya cuma kerangka; data tamu ada di IndexedDB (manifest), bukan di sini.
// Hanya navigasi dokumen yang di-cache — permintaan RSC (router.refresh) memakai URL yang sama
// dan tidak boleh menimpa HTML di cache.
const CACHE = "hmd-v2";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) =>
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  ),
);

const DOOR = /^\/panitia\/event\/[^/]+\/scan(\/cari)?$/;

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/figma/")) {
    e.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
            return res;
          }),
      ),
    );
    return;
  }

  const guestPage = url.pathname.startsWith("/t/") && !url.pathname.endsWith("/kalender");
  if (req.mode === "navigate" && (guestPage || DOOR.test(url.pathname))) {
    const key = url.origin + url.pathname; // tanpa query (?dari=wa, ?kamera=gagal)
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok && !res.redirected) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(key, copy));
          }
          return res;
        })
        .catch(() => caches.match(key).then((hit) => hit || Response.error())),
    );
  }
});
