/**
 * Service worker — membuat aplikasi tetap bisa dibuka tanpa internet.
 *
 * Strategi:
 *  - Navigasi (buka aplikasi): coba jaringan dulu, jatuh ke cache bila offline.
 *    Dengan begitu versi baru langsung terpakai saat online.
 *  - Aset (js/css/gambar): ambil dari cache dulu supaya cepat, lalu perbarui
 *    diam-diam di latar belakang (stale-while-revalidate).
 *
 * Daftar berkas dan nomor versi disuntikkan oleh scripts/build.mjs.
 */
const CACHE_NAME = 'baca-yuk-__APP_VERSION__';
const PRECACHE_URLS = __PRECACHE_MANIFEST__;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(
        names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name)),
      ))
      .then(() => self.clients.claim()),
  );
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    return (await cache.match(request)) || (await cache.match('./index.html'));
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);
  return cached || network;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  if (new URL(request.url).origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }
  event.respondWith(staleWhileRevalidate(request));
});
