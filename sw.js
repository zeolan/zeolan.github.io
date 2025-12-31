const PRECACHE = 'precache-v1';
const RUNTIME = 'runtime-v1';
const IMAGE_CACHE = 'images-v1';
const STATIC_DESTINATIONS = new Set(['style', 'script', 'font']);
const OFFLINE_URL = '/offline.html';

// Minimal safe list to avoid install failure when some assets are missing.
const PRECACHE_URLS = [
  '/',
  OFFLINE_URL,
  '/manifest.json',
  '/favicon.ico',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png'
];

async function safePrecache(urls) {
  const cache = await caches.open(PRECACHE);
  await Promise.all(
    urls.map(async (url) => {
      try {
        const res = await fetch(url, { cache: 'no-cache' });
        if (res && res.ok) await cache.put(url, res.clone());
      } catch (err) {
        console.warn('Precaching failed for', url, err);
      }
    })
  );
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      await safePrecache(PRECACHE_URLS);
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
        const keys = await caches.keys();
        await Promise.all(
          keys.map((key) => {
            if (key !== PRECACHE && key !== RUNTIME && key !== IMAGE_CACHE) return caches.delete(key);
          })
        );
      await self.clients.claim();
    })()
  );
});

// Network-first for navigation (pages), with offline fallback.
async function handleNavigationRequest(event) {
  try {
    const networkResponse = await fetch(event.request);
    // If response is not OK, try cache or offline
    if (!networkResponse || !networkResponse.ok) {
      const cached = await caches.match(event.request);
      if (cached) return cached;
      return caches.match(OFFLINE_URL);
    }
    // Update runtime cache
    const cache = await caches.open(RUNTIME);
    cache.put(event.request, networkResponse.clone()).catch(() => {});
    return networkResponse;
  } catch (err) {
    const cached = await caches.match(event.request);
    if (cached) return cached;
    return caches.match(OFFLINE_URL);
  }
}

// Cache-first for same-origin static assets (css/js/fonts).
async function handleAssetRequest(event) {
  const cached = await caches.match(event.request);
  if (cached) return cached;
  try {
    const response = await fetch(event.request);
    if (!response || !response.ok) {
      return caches.match(OFFLINE_URL);
    }
    const cache = await caches.open(RUNTIME);
    cache.put(event.request, response.clone()).catch(() => {});
    return response;
  } catch (err) {
    return caches.match(OFFLINE_URL);
  }
}

// Cache-first for images and icons with a dedicated cache.
async function handleImageRequest(event) {
  const req = event.request;
  try {
    const cache = await caches.open(IMAGE_CACHE);
    const cached = await cache.match(req);
    if (cached) return cached;

    const response = await fetch(req);
    if (response && response.ok) {
      cache.put(req, response.clone()).catch(() => {});
      return response;
    }
    // If network returned non-ok, fallback to precache offline page
    return caches.match(OFFLINE_URL);
  } catch (err) {
    const cached = await caches.match(req);
    if (cached) return cached;
    return caches.match(OFFLINE_URL);
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  // Only handle GET requests
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(event));
    return;
  }

  // Same-origin image/icon requests -> dedicated image cache
  if (request.destination === 'image') {
    event.respondWith(handleImageRequest(event));
    return;
  }

  // Same-origin requests for static assets (styles/scripts/fonts) -> cache-first
  if (url.origin === self.location.origin && STATIC_DESTINATIONS.has(request.destination)) {
    event.respondWith(handleAssetRequest(event));
    return;
  }

  // Fallback: try network, then cache, then offline page
  event.respondWith(
    (async () => {
      try {
        const response = await fetch(request);
        if (!response || !response.ok) {
          const cached = await caches.match(request);
          if (cached) return cached;
          if (request.headers.get('accept') && request.headers.get('accept').includes('text/html')) {
            return caches.match(OFFLINE_URL);
          }
          return new Response(null, { status: 503, statusText: 'Service Unavailable' });
        }
        const cache = await caches.open(RUNTIME);
        cache.put(request, response.clone()).catch(() => {});
        return response;
      } catch (err) {
        const cached = await caches.match(request);
        if (cached) return cached;
        if (request.headers.get('accept') && request.headers.get('accept').includes('text/html')) {
          return caches.match(OFFLINE_URL);
        }
        return new Response(null, { status: 503, statusText: 'Service Unavailable' });
      }
    })()
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
