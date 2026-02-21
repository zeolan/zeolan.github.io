// Cache version - increment this to force update all cached assets
// (styles, fonts, scripts, images, etc.)
const CACHE_VERSION = 'v8';

// Name of the cache used for pre-caching a small set of core files
// This cache is populated during the `install` event and updated only
// when the service worker is updated (versioned name).
const PRECACHE = `precache-${CACHE_VERSION}`;

// Name of the cache used for runtime caching of pages and other
// non-image assets fetched while the app is running.
const RUNTIME = `runtime-${CACHE_VERSION}`;

// Dedicated cache name for images and icons. Using a separate cache
// allows easier pruning and different lifetime policies later.
const IMAGE_CACHE = `images-${CACHE_VERSION}`;

// Set of request `destination` values that we treat as static assets
// (stylesheets, scripts, fonts). Using a Set makes the check clearer
// and easier to extend.
const STATIC_DESTINATIONS = new Set(['style', 'script', 'font']);

// Path to the offline fallback page that will be served when a
// navigation request cannot be fulfilled from network or cache.
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

const RUNTIME_CACHE_EXCLUDED_HOSTS = new Set(['www.googletagmanager.com']);

/*
  safePrecache(urls)
  - Purpose: Preload a minimal, essential set of URLs into the
    `PRECACHE` cache during the install step.
  - Behavior: Fetches each URL and stores a copy in the cache only if
    the fetch succeeds (response.ok). Errors for individual URLs are
    caught and logged so a missing/optional asset doesn't fail the
    entire install phase.
  - Note: We use `{ cache: 'no-cache' }` to ensure we request a fresh
    copy from the network rather than a possibly stale HTTP cache.
*/
async function safePrecache(urls) {
  const cache = await caches.open(PRECACHE);
  await Promise.all(
    urls.map(async (url) => {
      try {
        const res = await fetch(url, { cache: 'no-cache' });
        if (res && res.ok) await cache.put(url, res.clone());
      } catch (err) {
        // Individual precache failures are non-fatal; log for debugging.
        console.warn('Precaching failed for', url, err);
      }
    })
  );
}

// Install event: pre-cache core assets and move the worker to the
// 'installed' state. We call `skipWaiting()` so the new worker will
// activate immediately instead of waiting for existing clients to
// close (controlled via message if needed).
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      await safePrecache(PRECACHE_URLS);
      await self.skipWaiting();
    })()
  );
});

/*
  Activate event: clean up old caches and take control of clients.
  - We preserve `PRECACHE`, `RUNTIME`, and `IMAGE_CACHE` and delete
    other caches that may belong to older service worker versions.
  - `clients.claim()` lets the active worker start handling fetches
    from existing open pages without requiring a reload.
*/
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
/*
  handleNavigationRequest(event)
  - Purpose: Handle top-level navigation requests (when the user
    visits a page or refreshes). We prefer the network (fresh content)
    but fall back to cache or the offline page if the network fails.
  - Strategy: Network-first -> put successful responses into the
    runtime cache -> if network fails or returns non-OK, serve cached
    version or `OFFLINE_URL`.
*/
async function handleNavigationRequest(event) {
  try {
    const networkResponse = await fetch(event.request);
    // If network returned a non-OK response, try cache then offline.
    if (!networkResponse || !networkResponse.ok) {
      const cached = await caches.match(event.request);
      if (cached) return cached;
      return caches.match(OFFLINE_URL);
    }
    // Save a copy of the successful network response for future offline use.
    const cache = await caches.open(RUNTIME);
    cache.put(event.request, networkResponse.clone()).catch(() => {});
    return networkResponse;
  } catch (err) {
    // On fetch exception (e.g., offline), try to return a cached page,
    // otherwise show the offline fallback page.
    const cached = await caches.match(event.request);
    if (cached) return cached;
    return caches.match(OFFLINE_URL);
  }
}

// Cache-first for same-origin static assets (css/js/fonts).
/*
  handleAssetRequest(event)
  - Purpose: Serve static assets (CSS/JS/fonts) with a cache-first
    strategy: return cached copy if available, otherwise fetch from
    network and store a copy in the runtime cache for later.
  - Rationale: Static assets change less frequently and should be
    fast and available offline once cached.
*/
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
/*
  handleImageRequest(event)
  - Purpose: Cache images and icons in a dedicated `IMAGE_CACHE` using a
    cache-first strategy. Images can be larger and more numerous, so
    isolating them makes cache management simpler.
  - Behavior: return cached image when available; otherwise fetch and
    store a copy. On failure, fall back to the offline page (or a
    specific placeholder could be used instead).
*/
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
    // If network returned non-ok, fallback to precache offline page.
    return caches.match(OFFLINE_URL);
  } catch (err) {
    // If fetch or cache operations fail, try any cached copy or the
    // offline page as a last resort.
    const cached = await caches.match(req);
    if (cached) return cached;
    return caches.match(OFFLINE_URL);
  }
}

/*
  Fetch event handler - central routing for different types of
  requests. We only process GET requests; other methods are ignored
  and fall through to the network.

  Routing rules:
  - Navigation requests (HTML pages): handled by `handleNavigationRequest`
    using a network-first strategy with offline fallback.
  - Same-origin image requests: handled by `handleImageRequest` and cached in
    `IMAGE_CACHE` (cache-first).
  - External image requests: not intercepted, handled directly by browser.
  - Static assets (style/script/font): handled by `handleAssetRequest`
    (cache-first) but only for same-origin requests.
  - Fallback for other requests: try network then cache; if the
    request expects HTML, return the offline page; otherwise return a
    503 response.
*/
self.addEventListener('fetch', (event) => {
  const { request } = event;
  // Only handle GET requests; ignore other methods (POST, PUT, etc.).
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Bypass service worker entirely for Google Tag Manager / Analytics
  // scripts to avoid any CORS or caching interference when served
  // from external hosts (helps local http dev where external https
  // requests can behave differently).
  if (url.hostname &&
    RUNTIME_CACHE_EXCLUDED_HOSTS.has(url.hostname)
  ) {
    return;
  }

  // 1) Top-level navigations (pages)
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(event));
    return;
  }

  // 2) Same-origin images/icons -> dedicated image cache (cache-first)
  if (request.destination === 'image' && url.origin === self.location.origin) {
    event.respondWith(handleImageRequest(event));
    return;
  }

  // 3) External images -> let browser handle directly (no SW interception)
  if (request.destination === 'image' && url.origin !== self.location.origin) {
    return;
  }

  // 4) Static assets (styles/scripts/fonts) from the same origin
  if (url.origin === self.location.origin && STATIC_DESTINATIONS.has(request.destination)) {
    event.respondWith(handleAssetRequest(event));
    return;
  }

  // 4) Generic fallback for other GET requests: prefer network but
  //    fall back to cache and offline page for HTML requests.
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
        if (url.origin === self.location.origin && !RUNTIME_CACHE_EXCLUDED_HOSTS.has(url.hostname)) {
          cache.put(request, response.clone()).catch(() => {});
        }
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
