// Service Worker para Baby Book Landing Page
const CACHE_NAME = "babybook-v1";
const STATIC_CACHE = "babybook-static-v1";
const DYNAMIC_CACHE = "babybook-dynamic-v1";

// Recursos para cache estático
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/src/main.ts",
  "/src/main.css",
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Lora:wght@400;600&display=swap",
];

// Instalação do Service Worker
self.addEventListener("install", (event) => {
  console.log("[SW] Instalando Service Worker...");
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log("[SW] Cache estático criado");
      return cache.addAll(STATIC_ASSETS);
    }),
  );
  self.skipWaiting();
});

// Ativação do Service Worker
self.addEventListener("activate", (event) => {
  console.log("[SW] Ativando Service Worker...");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
          .map((name) => {
            console.log("[SW] Removendo cache antigo:", name);
            return caches.delete(name);
          }),
      );
    }),
  );
  self.clients.claim();
});

// Estratégia de cache: Network First com fallback para Cache
self.addEventListener("fetch", (event) => {
  // Ignorar requisições que não são GET
  if (event.request.method !== "GET") return;

  // Ignorar requisições para analytics e external APIs
  if (
    event.request.url.includes("google-analytics.com") ||
    event.request.url.includes("googletagmanager.com") ||
    event.request.url.includes("/api/")
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clonar a resposta porque ela só pode ser consumida uma vez
        const responseClone = response.clone();

        // Adicionar ao cache dinâmico
        caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(event.request, responseClone);
        });

        return response;
      })
      .catch(() => {
        // Se a rede falhar, buscar no cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          // Fallback para página offline (opcional)
          if (event.request.destination === "document") {
            return caches.match("/index.html");
          }
        });
      }),
  );
});

// Limpar cache dinâmico quando ficar muito grande
const limitCacheSize = (cacheName, maxItems) => {
  caches.open(cacheName).then((cache) => {
    cache.keys().then((keys) => {
      if (keys.length > maxItems) {
        cache.delete(keys[0]).then(() => limitCacheSize(cacheName, maxItems));
      }
    });
  });
};

// Limitar cache dinâmico a 50 itens
self.addEventListener("message", (event) => {
  if (event.data.action === "trimCache") {
    limitCacheSize(DYNAMIC_CACHE, 50);
  }
});
