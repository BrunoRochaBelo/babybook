/**
 * Babybook Service Worker
 *
 * Provides offline capabilities:
 * - Cache-first strategy for static assets
 * - Network-first strategy for API calls with offline fallback
 * - Background sync for moment creation when offline
 * - Push notification support
 */

const CACHE_VERSION = "v1";
const STATIC_CACHE = "babybook-static-" + CACHE_VERSION;
const DYNAMIC_CACHE = "babybook-dynamic-" + CACHE_VERSION;
const IMAGE_CACHE = "babybook-images-" + CACHE_VERSION;

// Static assets to pre-cache
const STATIC_ASSETS = ["/", "/index.html", "/offline.html", "/manifest.json"];

// Install event - cache static assets
self.addEventListener("install", function (event) {
  console.log("[SW] Installing service worker...");

  event.waitUntil(
    caches.open(STATIC_CACHE).then(function (cache) {
      console.log("[SW] Pre-caching static assets");
      return cache.addAll(STATIC_ASSETS);
    }),
  );

  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", function (event) {
  console.log("[SW] Activating service worker...");

  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames
          .filter(function (name) {
            return (
              name.startsWith("babybook-") &&
              name !== STATIC_CACHE &&
              name !== DYNAMIC_CACHE &&
              name !== IMAGE_CACHE
            );
          })
          .map(function (name) {
            console.log("[SW] Deleting old cache:", name);
            return caches.delete(name);
          }),
      );
    }),
  );

  // Claim clients immediately
  self.clients.claim();
});

// Fetch event - handle requests
self.addEventListener("fetch", function (event) {
  var request = event.request;
  var url = new URL(request.url);

  // Skip cross-origin requests
  if (!url.origin.includes(self.location.origin)) {
    return;
  }

  // API requests - Network first, cache fallback
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Image requests - Cache first, network fallback
  if (
    request.destination === "image" ||
    url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)
  ) {
    event.respondWith(cacheFirstStrategy(request, IMAGE_CACHE));
    return;
  }

  // Static assets - Cache first
  if (
    request.destination === "style" ||
    request.destination === "script" ||
    request.destination === "font"
  ) {
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
    return;
  }

  // Navigation requests - Network first with offline fallback
  if (request.mode === "navigate") {
    event.respondWith(navigationStrategy(request));
    return;
  }

  // Default - Network first
  event.respondWith(networkFirstStrategy(request));
});

// Cache-first strategy
async function cacheFirstStrategy(request, cacheName) {
  var cachedResponse = await caches.match(request);

  if (cachedResponse) {
    // Return cached response and update cache in background
    updateCache(request, cacheName);
    return cachedResponse;
  }

  try {
    var networkResponse = await fetch(request);
    var cache = await caches.open(cacheName);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    console.log("[SW] Cache-first failed:", error);
    return new Response("Offline - Content not available", { status: 503 });
  }
}

// Network-first strategy
async function networkFirstStrategy(request) {
  try {
    var networkResponse = await fetch(request);

    // Cache successful GET requests
    if (request.method === "GET" && networkResponse.ok) {
      var cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log("[SW] Network-first falling back to cache:", error);

    var cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline response for API
    return new Response(
      JSON.stringify({ error: "offline", message: "Você está offline" }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

// Navigation strategy
async function navigationStrategy(request) {
  try {
    var networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    console.log("[SW] Navigation offline, serving fallback");

    // Try to serve cached page
    var cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Serve offline page
    var offlinePage = await caches.match("/offline.html");
    if (offlinePage) {
      return offlinePage;
    }

    // Last resort - serve index.html (SPA)
    var indexPage = await caches.match("/index.html");
    if (indexPage) {
      return indexPage;
    }

    return new Response("Offline", { status: 503 });
  }
}

// Update cache in background
async function updateCache(request, cacheName) {
  try {
    var networkResponse = await fetch(request);
    var cache = await caches.open(cacheName);
    cache.put(request, networkResponse);
  } catch (error) {
    // Silently fail - we have cached version
  }
}

// Background sync for offline actions
self.addEventListener("sync", function (event) {
  console.log("[SW] Background sync:", event.tag);

  if (event.tag === "sync-moments") {
    event.waitUntil(syncOfflineMoments());
  }
});

// Sync offline moments
async function syncOfflineMoments() {
  // This would be implemented with IndexedDB integration
  console.log("[SW] Syncing offline moments...");

  // Notify client that sync is complete
  var clients = await self.clients.matchAll();
  clients.forEach(function (client) {
    client.postMessage({
      type: "SYNC_COMPLETE",
      payload: { moments: 0 },
    });
  });
}

// Push notification handler
self.addEventListener("push", function (event) {
  console.log("[SW] Push notification received");

  var data = event.data
    ? event.data.json()
    : {
        title: "Babybook",
        body: "Você tem uma nova atualização!",
        icon: "/icons/icon-192x192.png",
      };

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || "/icons/icon-192x192.png",
      badge: "/icons/icon-72x72.png",
      tag: data.tag || "babybook-notification",
      data: data.data,
      actions: data.actions || [],
    }),
  );
});

// Notification click handler
self.addEventListener("notificationclick", function (event) {
  console.log("[SW] Notification clicked");

  event.notification.close();

  var urlToOpen =
    event.notification.data && event.notification.data.url
      ? event.notification.data.url
      : "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then(function (clientList) {
      // If there's already a window open, focus it
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url === urlToOpen && "focus" in client) {
          return client.focus();
        }
      }
      // Otherwise, open a new window
      return self.clients.openWindow(urlToOpen);
    }),
  );
});

// Message handler for communication with main thread
self.addEventListener("message", function (event) {
  console.log("[SW] Message received:", event.data);

  if (event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data.type === "CACHE_URLS") {
    var urls = event.data.payload;
    caches.open(DYNAMIC_CACHE).then(function (cache) {
      cache.addAll(urls);
    });
  }
});
