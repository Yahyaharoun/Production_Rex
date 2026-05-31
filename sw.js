// ============================================================
// SERVICE WORKER — Production Rex PWA
// Stratégie : Cache-First pour assets, Network-First pour API
// ============================================================

const CACHE_NAME = 'production-rex-v1';
const OFFLINE_URL = '/offline.html';

// Assets à mettre en cache lors de l'installation
const PRECACHE_URLS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/favicon.svg',
];

// ─── Installation ──────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  console.log('[SW] Installation...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Mise en cache initiale');
      return cache.addAll(PRECACHE_URLS.filter(url => {
        // Only cache URLs that exist
        return fetch(url).then(r => r.ok).catch(() => false);
      }));
    }).catch(err => {
      console.warn('[SW] Erreur mise en cache initiale:', err);
    })
  );
  self.skipWaiting();
});

// ─── Activation ────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  console.log('[SW] Activation...');
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Suppression ancien cache:', name);
            return caches.delete(name);
          })
      )
    )
  );
  self.clients.claim();
});

// ─── Interception des requêtes ─────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ignorer les requêtes non-GET et les extensions de navigateur
  if (event.request.method !== 'GET') return;
  if (url.protocol === 'chrome-extension:') return;

  // Pour les requêtes Supabase → Network-First (données fraîches)
  if (url.hostname.includes('supabase.co')) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  // Pour les assets statiques → Cache-First
  if (
    url.pathname.match(/\.(js|css|png|svg|ico|woff|woff2|ttf|jpg|jpeg|webp)$/)
  ) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  // Pour les pages HTML → Network-First avec fallback offline
  if (event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirstWithOffline(event.request));
    return;
  }

  // Par défaut → Stale While Revalidate
  event.respondWith(staleWhileRevalidate(event.request));
});

// ─── Stratégies de cache ───────────────────────────────────────────────────

// Cache-First : retourne le cache, sinon réseau
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Ressource non disponible hors ligne', { status: 503 });
  }
}

// Network-First : réseau d'abord, sinon cache
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response(JSON.stringify({ error: 'Hors ligne' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Network-First avec page offline
async function networkFirstWithOffline(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    const offlinePage = await caches.match(OFFLINE_URL);
    return offlinePage || new Response('<h1>Hors ligne</h1>', { headers: { 'Content-Type': 'text/html' } });
  }
}

// Stale-While-Revalidate : retourne cache + met à jour en arrière-plan
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => cached);
  return cached || fetchPromise;
}

// ─── Push notifications (futur) ────────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  self.registration.showNotification(data.title || 'Production Rex', {
    body: data.body || '',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
  });
});
