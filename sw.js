// Ducky-Time Service Worker for Push Notifications

self.addEventListener('install', (event) => {
    console.log('[SW] Service Worker installed');
    // Force the waiting service worker to become the active service worker
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('[SW] Service Worker activated');
    // Tell the active service worker to take control of the page immediately
    event.waitUntil(clients.claim());
});

// Listen for messages from the main page to show notifications
self.addEventListener('message', (event) => {
    console.log('[SW] Message received:', event.data);

    if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
        const { title, body } = event.data;

        // Use waitUntil to ensure SW stays alive until notification is shown
        const notificationPromise = self.registration.showNotification(title, {
            body: body,
            requireInteraction: true,
            timestamp: Date.now()
        }).then(() => {
            console.log('[SW] Notification shown successfully');
        }).catch((err) => {
            console.error('[SW] Error showing notification:', err);
        });

        event.waitUntil(notificationPromise);
    }
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification clicked');
    event.notification.close();

    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((clientList) => {
            for (const client of clientList) {
                if ('focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});
