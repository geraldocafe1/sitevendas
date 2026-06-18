// Service Worker Cache configurations (Grão Nobre PWA)
const CACHE_NAME = 'grao-nobre-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/css/app.css',
  '/js/cart.js',
  '/js/countdown.js',
  '/js/search.js',
  '/js/pwa.js'
];

// Install Event - cache static items
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[PWA SW] Pre-caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Event - clear old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('[PWA SW] Clearing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Dynamic caching strategies
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // Exclude admin panel and API routes from SW cache to prevent data desynchronization
  if (url.pathname.startsWith('/admin') || url.pathname.startsWith('/api')) {
    return;
  }

  // Check if it's a static file request (Cache First Strategy)
  const isStatic = ['.css', '.js', '.png', '.jpg', '.jpeg', '.webp', '.svg', '.json', '.woff2'].some(ext => url.pathname.endsWith(ext));

  if (isStatic) {
    event.respondWith(
      caches.match(req).then(cachedResponse => {
        if (cachedResponse) return cachedResponse;

        return fetch(req).then(networkResponse => {
          if (!networkResponse || networkResponse.status !== 200) return networkResponse;

          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(req, responseToCache);
          });
          return networkResponse;
        }).catch(() => {
          // Silent fail for static assets if offline
        });
      })
    );
  } else {
    // Network First Strategy for pages
    event.respondWith(
      fetch(req).then(networkResponse => {
        // Cache new successful page requests
        if (networkResponse && networkResponse.status === 200 && req.method === 'GET') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(req, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // If offline and request failed, try to serve from cache
        return caches.match(req).then(cachedResponse => {
          if (cachedResponse) return cachedResponse;

          // Fallback response when page is not cached
          return new Response(
            `<!DOCTYPE html>
            <html lang="pt-BR">
            <head>
              <meta charset="UTF-8">
              <title>Você está offline - Grão Nobre</title>
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <link rel="stylesheet" href="/css/app.css">
            </head>
            <body class="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-center p-6">
              <div class="max-w-md w-full bg-white border border-gray-200 rounded-2xl shadow-xl p-8 space-y-4">
                <span class="text-4xl block">📶</span>
                <h1 class="text-xl font-bold text-slate-800">Sem conexão com a Internet</h1>
                <p class="text-xs text-gray-500 leading-relaxed">
                  Não conseguimos carregar esta página. Verifique sua conexão e tente carregar novamente.
                </p>
                <button onclick="location.reload()" class="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-md transition-colors">
                  Tentar Novamente
                </button>
              </div>
            </body>
            </html>`,
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        });
      })
    );
  }
});
