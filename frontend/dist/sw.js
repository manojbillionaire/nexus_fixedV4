// sw.js — self-destruct: wipe all caches, unregister this SW, reload all tabs
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.clients.claim())
      .then(() =>
        self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      )
      .then(clients => {
        clients.forEach(client => {
          // Tell each open tab: "unregister me and reload"
          client.postMessage({ type: 'SW_SELF_DESTRUCT' });
        });
      })
  );
});

// No fetch handler — never intercept any network requests
