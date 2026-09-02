/**
 * SERVICE WORKER CHO PHẦN MỀM XẾP LỊCH YHCT - PHCN (T.I.M.E.S System v4.0.0 Multi-Tenant SaaS)
 * Quản lý Cache đệm tĩnh, cho phép mở App ngoại tuyến (Offline-first) và tải tức thì.
 */

const CACHE_NAME = 'pmcg-v4-cache-4.0.0-rev41';
const STATIC_ASSETS = [
  './',
  './index.html',
  './hdsd.html',
  './manifest.json',
  './css/style.css',
  './css/mobile.css',
  './css/frappe-gantt.css',
  './js/init.js',
  './js/app.js',
  './js/thongke.js',
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

// 1. Cài đặt Service Worker và nạp trước các tệp tĩnh
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Đang nạp bộ nhớ đệm tĩnh v3.2.0...');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[Service Worker] Một số tài sản chưa nạp được vào cache:', err);
      });
    })
  );
});

// 2. Kích hoạt và dọn dẹp các phiên bản cache cũ
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Đang dọn dẹp cache cũ:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Xử lý yêu cầu nạp tài nguyên (Fetch Strategy)
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Bỏ qua các yêu cầu API gửi tới Cloudflare Workers hoặc Google Apps Script (đã có offline-sync-engine xử lý)
  if (
    requestUrl.origin !== self.location.origin ||
    event.request.method !== 'GET' ||
    requestUrl.pathname.includes('/api') ||
    requestUrl.hostname.includes('workers.dev') ||
    requestUrl.hostname.includes('google.com')
  ) {
    return;
  }

  // Chiến lược Stale-While-Revalidate cho tài sản tĩnh
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
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
          // Khi mất mạng, nếu là yêu cầu HTML trang chính thì trả về index.html từ cache
          if (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html')) {
            return caches.match('./index.html');
          }
        });

      return cachedResponse || fetchPromise;
    })
  );
});

// Lắng nghe lệnh SKIP_WAITING từ trang chủ để cập nhật SW ngay lập tức
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[Service Worker] Nhận SKIP_WAITING, kích hoạt ngay...');
    self.skipWaiting();
  }
});
