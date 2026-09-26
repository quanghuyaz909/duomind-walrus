self.addEventListener("push", (event) => {
  let data = { title: "DuoMind", body: "You have a new reminder." };
  try {
    if (event.data) data = event.data.json();
  } catch (e) {}
  event.waitUntil(
    self.registration.showNotification(data.title || "DuoMind", {
      body: data.body || "",
      icon: "/avatar.png",
      badge: "/avatar.png",
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow("/"));
});
