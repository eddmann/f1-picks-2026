// F1 Picks 2026 — Service Worker for Push Notifications

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "F1 Picks 2026", body: event.data.text() };
  }

  const options = {
    body: payload.body || "",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-192x192.png",
    tag: payload.tag || "f1-picks-default",
    data: { url: payload.url || "/" },
    renotify: true,
  };

  event.waitUntil(
    self.registration.showNotification(payload.title || "F1 Picks 2026", options),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        // Focus existing window if one is open
        for (const client of clients) {
          if (new URL(client.url).origin === self.location.origin) {
            client.navigate(url);
            return client.focus();
          }
        }
        // Open new window
        return self.clients.openWindow(url);
      }),
  );
});
