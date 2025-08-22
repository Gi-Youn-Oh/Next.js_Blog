const CACHE_NAME = 'giyoun-pwa-cache';
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',              // 홈
        OFFLINE_URL,      // 오프라인 페이지
      ]);
    })
  );
  console.log('✅ Service Worker installed');
});

self.addEventListener('activate', (event) => {
  // 이전 캐시 삭제
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  console.log('🚀 Service Worker activated');
});

self.addEventListener("push", function (event) {
  const data = event.data?.json() || {};
  const title = data.title || "알림!";
  const options = {
    body: data.body || "알림 내용입니다.",
    icon: "/images/splash-img.png",
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // chrome-extension:// 같은 요청은 무시
  if (!request.url.startsWith('http')) {
    return;
  }

  // HTML 페이지 (navigate)
  if (request.mode === 'navigate') {

    caches.open(CACHE_NAME).then((cache) => {
      cache.keys().then((requests) => {
        requests.forEach((request) => {
          console.log('🗂 캐시에 들어있는 파일:', request.url);
        });
      });
    });
    
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // 정적 파일 (script, style, image, font)
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'image' ||
    request.destination === 'font'
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((response) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, response.clone()); // http/https만 처리됨
            return response;
          });
        });
      })
    );
  }
});