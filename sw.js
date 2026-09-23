/**
 * SERVICE WORKER CHO PHáº¦N Má»€M Xáº¾P Lá»ŠCH YHCT - PHCN (T.I.M.E.S System v4.0.2 Multi-Tenant SaaS)
 * Quáº£n lÃ½ Cache Ä‘á»‡m tÄ©nh, cho phÃ©p má»Ÿ App ngoáº¡i tuyáº¿n (Offline-first) vÃ  táº£i tá»©c thÃ¬.
 */

const CACHE_NAME = 'pmcg-v4-cache-4.1.4-rev9';
const STATIC_ASSETS = [
  './',
  './index.html',
  './hdsd.html',
  './manifest.json',
  './css/style.css',
  './css/mobile.css',
  './css/frappe-gantt.css',
  './js/schedule-utils.js',
  './js/schedule-strategies.js',
  './js/modules/export-service.js',
  './js/modules/history-manager.js',
  './js/init.js',
  './js/app.js',
  './js/thongke.js',
  './js/ai-scheduler.js',
  './js/cp-solver.js',
  './js/scheduler-engine.js',
  './js/sync.js',
  './js/offline-sync-engine.js',
  './js/dexie.min.js',
  './js/purify.min.js',
  './js/fuse.min.js',
  './js/chart.min.js',
  './js/zod.min.js',
  './js/sortable.min.js',
  './js/frappe-gantt.min.js',
  './js/pdfmake.min.js',
  './js/vfs_fonts.js',
  './logo-chuan-chinh.png',
  './favicon-128.png',
  './apple-touch-icon.png'
];

// 1. CÃ i Ä‘áº·t Service Worker vÃ  náº¡p trÆ°á»›c cÃ¡c tá»‡p tÄ©nh
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[Service Worker] Lá»—i náº¡p cache tÄ©nh:', err);
      });
    })
  );
});

// 2. KÃ­ch hoáº¡t vÃ  dá»n dáº¹p cÃ¡c phiÃªn báº£n cache cÅ©
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Äang dá»n dáº¹p cache cÅ©:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Xá»­ lÃ½ yÃªu cáº§u náº¡p tÃ i nguyÃªn (Fetch Strategy: Network-First cho HTML & JS/CSS Ä‘á»ƒ luÃ´n náº¡p báº£n má»›i nháº¥t)
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // VÃ´ hiá»‡u hÃ³a triá»‡t Ä‘á»ƒ Cloudflare Analytics Beacon vÃ  Web Vitals ngoáº¡i vi
  if (
    requestUrl.hostname.includes('cloudflareinsights.com') ||
    requestUrl.pathname.includes('beacon.min.js')
  ) {
    event.respondWith(
      new Response('/* cf-beacon disabled */', {
        status: 200,
        headers: { 'Content-Type': 'application/javascript; charset=utf-8' }
      })
    );
    return;
  }

  // LuÃ´n náº¡p trá»±c tiáº¿p version.json tá»« máº¡ng Ä‘á»ƒ kiá»ƒm tra phiÃªn báº£n má»›i tá»©c thÃ¬
  if (requestUrl.pathname.endsWith('version.json')) {
    event.respondWith(fetch(event.request, { cache: 'no-store' }).catch(() => caches.match(event.request)));
    return;
  }

  // Bá» qua cÃ¡c yÃªu cáº§u API gá»­i tá»›i Cloudflare Workers hoáº·c Google Apps Script (Ä‘Ã£ cÃ³ offline-sync-engine xá»­ lÃ½)
  if (
    requestUrl.origin !== self.location.origin ||
    event.request.method !== 'GET' ||
    requestUrl.pathname.includes('/api') ||
    requestUrl.hostname.includes('workers.dev') ||
    requestUrl.hostname.includes('google.com')
  ) {
    return;
  }

  // Network-First: LuÃ´n táº£i tá»« mÃ¡y chá»§ Ä‘á»ƒ láº¥y báº£n má»›i nháº¥t, náº¿u máº¥t máº¡ng má»›i tráº£ vá» Cache
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          if (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html')) {
            return caches.match('./index.html');
          }
        });
      })
  );
});

// Láº¯ng nghe lá»‡nh SKIP_WAITING tá»« trang chá»§ Ä‘á»ƒ cáº­p nháº­t SW ngay láº­p tá»©c
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[Service Worker] Nháº­n SKIP_WAITING, kÃ­ch hoáº¡t ngay...');
    self.skipWaiting();
  }
});


