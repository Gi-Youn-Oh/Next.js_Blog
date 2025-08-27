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

self.addEventListener('fetch', (event) => {
  // navigation 요청에만 offline 대응
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(OFFLINE_URL);
      }),
    );
  }
});

// self.addEventListener("push", function (event) {
//   const data = event.data?.json() || {};
//   const title = data.title || "알림!";
//   const options = {
//     body: data.body || "알림 내용입니다.",
//     icon: "/images/splash-img.png",
//   };

//   event.waitUntil(
//     self.registration.showNotification(title, options)
//   );
// });

self.addEventListener('push', function (event) {
  if (event.data) {
    const data = event.data.json()
    const options = {
      body: data.body,
      icon: data.icon || '/images/splash-img.png',
      badge: '/images/splash-img.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: '2',
      },
    }
    event.waitUntil(self.registration.showNotification(data.title, options))
  }
})
 
self.addEventListener('notificationclick', function (event) {
  console.log('Notification click received.')
  event.notification.close()
  event.waitUntil(clients.openWindow('https://giyoun-blog.vercel.app/'))
})


