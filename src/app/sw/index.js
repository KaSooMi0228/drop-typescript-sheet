
import "../../sentry"

self.addEventListener("install", function (event) {
  event.waitUntil(
    (async function () {
      const cache = await self.caches.open("dropsheet");

      await Promise.all([cache.addAll(self.ALL_ASSETS),
      cache.add(new Request('/', {
        cache: 'reload'
      })),
       cache.add(new Request('/?offline', {
        cache: 'reload'
      }))   
    ])
      
      return self.skipWaiting();
    })()
  );
});
if (process.env.NODE_ENV === "production" || true) {
  self.addEventListener("fetch", function (event) {
    if (event.request.url.startsWith(self.registration.scope)) {
      event.respondWith(
        self.caches.match(event.request).then(function (response) {
          return response || fetch(event.request);
        })
      );
    }
  });
}
self.addEventListener("activate", async function (event) {
  const cache = await self.caches.open("dropsheet");
  for (const request of await cache.keys()) {
    const path = new URL(request.url);
    if (self.ALL_ASSETS.indexOf(path.pathname) === -1 && path.pathname !== '/') {
      cache.delete(request);
    }
  }
});

global.onpush = function (event) {
  event.waitUntil((async () => {
    const data = await event.data.json()
    return self.registration.showNotification(data.label, { data })
  })())
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(self.clients.openWindow(`#//?type=${event.notification.data.type}&id=${event.notification.data.id}`))
})