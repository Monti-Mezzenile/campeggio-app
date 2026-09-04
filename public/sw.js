self.addEventListener('install', function () {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', function (event) {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { body: event.data.text() };
  }

  const options = {
    body: data.body || data.message || '',
    icon: data.icon || '/tamagotchi/fase1_coniglio_piccolo.png',
    badge: data.badge || '/icons/wallace.png',
    tag: data.tag || 'mascotte',
    renotify: true,
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/mascotte'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'MONTI', options)
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  event.waitUntil(
    (async function () {
      const targetUrl = new URL(
        event.notification.data?.url || '/mascotte',
        self.location.origin
      ).href;
      const windowClients = await clients.matchAll({
        type: 'window',
        includeUncontrolled: true
      });

      for (const client of windowClients) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          if ('navigate' in client) await client.navigate(targetUrl);
          return client.focus();
        }
      }

      return clients.openWindow(targetUrl);
    })()
  );
});
