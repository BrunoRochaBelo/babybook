/* eslint-disable no-undef */
/// <reference lib="webworker" />
/* eslint-disable no-undef */
declare const self: ServiceWorkerGlobalScope & typeof globalThis;
import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { CacheFirst, StaleWhileRevalidate } from "workbox-strategies";

const VERSION = "v1.0.0";
const CACHE_PREFIX = "babybook-landing";
const CACHES = {
  static: `${CACHE_PREFIX}-static-${VERSION}`,
  images: `${CACHE_PREFIX}-images-${VERSION}`,
  fonts: `${CACHE_PREFIX}-fonts-${VERSION}`,
  assets: `${CACHE_PREFIX}-assets-${VERSION}`,
  runtime: `${CACHE_PREFIX}-runtime-${VERSION}`,
};

// Injected by workbox
// @ts-ignore
precacheAndRoute(
  (self.__WB_MANIFEST || []).concat([
    { url: "/offline.html", revision: VERSION },
  ]),
);

// === Runtime caching ===
// HTML - network first
registerRoute(
  ({ request }) => request.destination === "document",
  async ({ request }) => {
    try {
      const response = await fetch(request);
      if (response && response.ok) return response;
    } catch (err) {
      // network failed; fall back to offline page below
    }

    const cache = await caches.open(CACHES.static);
    const fallback = await cache.match("/offline.html");
    return (
      fallback ||
      new Response("offline", { status: 503, statusText: "Offline" })
    );
  },
);

// Fonts - cache first
registerRoute(
  ({ request }) =>
    request.destination === "font" ||
    /\.(?:woff2?|ttf|otf|eot)$/i.test(request.url),
  new CacheFirst({ cacheName: CACHES.fonts }),
);

// Images - stale while revalidate
registerRoute(
  ({ request }) =>
    request.destination === "image" ||
    /\.(?:jpg|jpeg|png|gif|webp|svg|ico)$/i.test(request.url),
  new StaleWhileRevalidate({ cacheName: CACHES.images }),
);

// CSS and JS - stale while revalidate
registerRoute(
  ({ request }) =>
    request.destination === "style" ||
    request.destination === "script" ||
    /\.(?:css|js)$/i.test(request.url),
  new StaleWhileRevalidate({ cacheName: CACHES.assets }),
);

// Video - network only
registerRoute(
  ({ request }) =>
    request.destination === "video" || /\.(?:mp4|webm|ogg)$/i.test(request.url),
  async ({ request }) => fetch(request),
);

// Messages from clients
self.addEventListener("message", (event: any) => {
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

// --- Cache utilities ---
const trimCache = async (cacheName: string, maxItems: number) => {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    const deleteCount = keys.length - maxItems;
    await Promise.all(keys.slice(0, deleteCount).map((k) => cache.delete(k)));
    console.log(
      `[SW ${VERSION}] Trimmed ${cacheName}: removed ${deleteCount} items`,
    );
  }
};

const CACHE_LIMITS = { images: 50, assets: 30, runtime: 20 };

const trimAllCaches = async () => {
  await Promise.all([
    trimCache(CACHES.images, CACHE_LIMITS.images),
    trimCache(CACHES.assets, CACHE_LIMITS.assets),
    trimCache(CACHES.runtime, CACHE_LIMITS.runtime),
  ]);
};

const clearAllCaches = async () => {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map((name) => caches.delete(name)));
  console.log(`[SW ${VERSION}] All caches cleared`);
};

const getCacheStatus = async () => {
  const status: Record<string, any> = {};
  for (const [name, cacheName] of Object.entries(CACHES)) {
    try {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      const limit =
        (CACHE_LIMITS as Record<string, number>)[name] || "unlimited";
      status[name] = { count: keys.length, limit };
    } catch (error) {
      status[name] = { error: (error as Error).message };
    }
  }
  return status;
};

setInterval(
  () => {
    trimAllCaches();
  },
  5 * 60 * 1000,
);

self.addEventListener("activate", (event: any) => {
  event.waitUntil(
    (async () => {
      const validCaches = Object.values(CACHES);

      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((n) => !validCaches.includes(n))
          .map((n) => caches.delete(n)),
      );

      await self.clients.claim();
      const clients = await self.clients.matchAll();
      clients.forEach((client) =>
        client.postMessage({ type: "SW_ACTIVATED", version: VERSION }),
      );
      console.log(`[SW ${VERSION}] Activated`);
    })(),
  );
});

console.log(`[SW ${VERSION}] Loaded (injectManifest)`);
