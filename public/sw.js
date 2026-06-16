// public/sw.js
// Service Worker — handles push notifications for appointment alerts

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

self.addEventListener("push", e => {
  const data = e.data?.json() || {};
  const title   = data.title   || "New Appointment";
  const options = {
    body:    data.body    || "You have a new appointment booking.",
    icon:    data.icon    || "/icon-192.png",
    badge:   data.badge   || "/icon-72.png",
    tag:     data.tag     || "appointment",
    requireInteraction: true,
    vibrate: [200, 100, 200],
    data:    { url: data.url || "/admin", appointmentId: data.appointmentId },
    actions: [
      { action: "view",    title: "View Appointment" },
      { action: "dismiss", title: "Dismiss"          },
    ],
  };
  e.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", e => {
  e.notification.close();
  if (e.action === "dismiss") return;
  const url = e.notification.data?.url || "/admin";
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(clients => {
      const existing = clients.find(c => c.url.includes("/admin"));
      if (existing) return existing.focus();
      return self.clients.openWindow(url);
    })
  );
});
