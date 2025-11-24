// === ADVANCED SERVICE WORKER (CONFLICTING: LEGACY placeholder) ===
// This placeholder is retained to avoid breaking builds that reference /sw.js directly
// The actual service worker is now generated via vite-plugin-pwa using src/sw.ts (injectManifest).
// Keep this file as a placeholder if a build incorrectly copies public files with sw.js. It should not be used.

const VERSION = "v1.0.0";
const CACHE_PREFIX = "babybook-landing";
const CACHES = {
  static: `${CACHE_PREFIX}-static-${VERSION}`,
  images: `${CACHE_PREFIX}-images-${VERSION}`,
  fonts: `${CACHE_PREFIX}-fonts-${VERSION}`,
  assets: `${CACHE_PREFIX}-assets-${VERSION}`,
  runtime: `${CACHE_PREFIX}-runtime-${VERSION}`,
};

// Precache - Assets críticos
const PRECACHE_ASSETS = ["/", "/index.html"];

// Parse HTML to find referenced CSS/JS assets and add them to precache during install
const extractAssetsFromHTML = async (htmlText) => {
  const urls = new Set();
  // href src regex for assets
  const regex = /(?:href|src)=(?:"|')([^"']+\.(?:css|js|webmanifest))(?:"|')/gi;
  let match;
  while ((match = regex.exec(htmlText)) !== null) {
    const assetUrl = match[1];
    // Only add same-origin assets
    if (assetUrl.startsWith("/") && !assetUrl.startsWith("//")) {
      urls.add(assetUrl);
    }
  }
  return Array.from(urls);
};

// Cache limits
const CACHE_LIMITS = {
  images: 50,
  assets: 30,
  runtime: 20,
};

// === INSTALL ===
self.addEventListener("install", (event) => {
  console.log(`[SW ${VERSION}] Installing...`);

  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHES.static);
        // Basic precache
        await cache.addAll(PRECACHE_ASSETS);

        // Try to fetch index.html and extract assets (css/js) to precache
        try {
          const resp = await fetch("/index.html");
          if (resp && resp.ok) {
            const text = await resp.text();
            const assets = await extractAssetsFromHTML(text);
            if (assets.length > 0) {
              await Promise.all(
                assets.map((url) => cache.add(url).catch(() => {})),
              );
              console.log(
                `[SW ${VERSION}] Precached assets from index.html:`,
                assets,
              );
            }
          }
        } catch (err) {
          console.warn(
            `[SW ${VERSION}] Could not prefetch assets from index.html:`,
            err,
          );
        }
        console.log(`[SW ${VERSION}] Precache complete`);

        // Força ativação imediata
        await self.skipWaiting();
      } catch (error) {
        console.error(`[SW ${VERSION}] Install failed:`, error);
      }
    })(),
  );
});

// === ACTIVATE ===
self.addEventListener("activate", (event) => {
  console.log(`[SW ${VERSION}] Activating...`);

  event.waitUntil(
    (async () => {
      try {
        // Remove caches antigos
        const cacheNames = await caches.keys();
        const validCaches = Object.values(CACHES);

        await Promise.all(
          cacheNames
            .filter((name) => !validCaches.includes(name))
            .map((name) => {
              console.log(`[SW ${VERSION}] Deleting old cache:`, name);
              return caches.delete(name);
            }),
        );

        // Toma controle imediatamente
        await self.clients.claim();
        // Notify clients of updated service worker
        const clients = await self.clients.matchAll();
        clients.forEach((client) => {
          client.postMessage({ type: "SW_ACTIVATED", version: VERSION });
        });
        console.log(`[SW ${VERSION}] Activated`);
      } catch (error) {
        console.error(`[SW ${VERSION}] Activate failed:`, error);
      }
    })(),
  );
});

// === FETCH STRATEGIES ===

// Cache First (Fonts)
const cacheFirst = async (request, cacheName) => {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    throw error;
  }
};

// Network First (HTML)
const networkFirst = async (request, cacheName) => {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    throw error;
  }
};

// Stale While Revalidate (Assets)
const staleWhileRevalidate = async (request, cacheName) => {
  const cached = await caches.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        const cache = caches.open(cacheName);
        cache.then((c) => c.put(request, response.clone()));
      }
      return response;
    })
    .catch(() => cached);

  return cached || fetchPromise;
};

// === FETCH HANDLER ===
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Ignore analytics and external APIs
  if (
    url.hostname.includes("google-analytics.com") ||
    url.hostname.includes("googletagmanager.com") ||
    url.hostname.includes("analytics") ||
    url.pathname.startsWith("/api/")
  ) {
    return;
  }

  // Route by resource type
  event.respondWith(
    (async () => {
      try {
        // HTML - Network First
        if (request.destination === "document") {
          return await networkFirst(request, CACHES.runtime);
        }

        // Fonts - Cache First (long-lived)
        if (
          request.destination === "font" ||
          url.pathname.includes(".woff") ||
          url.hostname.includes("fonts.gstatic.com")
        ) {
          return await cacheFirst(request, CACHES.fonts);
        }

        // Images - Stale While Revalidate
        if (
          request.destination === "image" ||
          /\.(jpg|jpeg|png|gif|webp|svg|ico)$/i.test(url.pathname)
        ) {
          return await staleWhileRevalidate(request, CACHES.images);
        }

        // CSS/JS - Stale While Revalidate
        if (
          request.destination === "style" ||
          request.destination === "script" ||
          /\.(css|js)$/i.test(url.pathname)
        ) {
          return await staleWhileRevalidate(request, CACHES.assets);
        }

        // Video - Network only (too large to cache)
        if (
          request.destination === "video" ||
          /\.(mp4|webm|ogg)$/i.test(url.pathname)
        ) {
          return await fetch(request);
        }

        // Default - Stale While Revalidate
        return await staleWhileRevalidate(request, CACHES.runtime);
      } catch (error) {
        // Fallback for HTML
        if (request.destination === "document") {
          const fallback = await caches.match("/index.html");
          if (fallback) return fallback;
        }

        throw error;
      }
    })(),
  );
});

// === MESSAGE HANDLER ===
self.addEventListener("message", (event) => {
  const { action } = event.data || {};

  if (action === "skipWaiting") {
    self.skipWaiting();
  }

  if (action === "trimCaches") {
    trimAllCaches();
  }

  if (action === "clearCaches") {
    clearAllCaches().then(() => {
      event.ports[0]?.postMessage({ success: true });
    });
  }

  if (action === "getCacheStatus") {
    getCacheStatus().then((status) => {
      event.ports[0]?.postMessage(status);
    });
  }
});

// === CACHE MANAGEMENT ===

// Trim cache to max items
const trimCache = async (cacheName, maxItems) => {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();

  if (keys.length > maxItems) {
    const deleteCount = keys.length - maxItems;
    await Promise.all(
      keys.slice(0, deleteCount).map((key) => cache.delete(key)),
    );
    console.log(`[SW] Trimmed ${cacheName}: removed ${deleteCount} items`);
  }
};

// Trim all caches
const trimAllCaches = async () => {
  await Promise.all([
    trimCache(CACHES.images, CACHE_LIMITS.images),
    trimCache(CACHES.assets, CACHE_LIMITS.assets),
    trimCache(CACHES.runtime, CACHE_LIMITS.runtime),
  ]);
};

// Clear all caches
const clearAllCaches = async () => {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map((name) => caches.delete(name)));
  console.log(`[SW] All caches cleared`);
};

// Get cache status
const getCacheStatus = async () => {
  const status = {};

  for (const [name, cacheName] of Object.entries(CACHES)) {
    try {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      status[name] = {
        count: keys.length,
        limit: CACHE_LIMITS[name] || "unlimited",
      };
    } catch (error) {
      status[name] = { error: error.message };
    }
  }

  return status;
};

// Periodic cache trimming
setInterval(
  () => {
    trimAllCaches();
  },
  5 * 60 * 1000,
); // Every 5 minutes

console.log(`[SW ${VERSION}] Loaded`);
