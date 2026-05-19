const CACHE_NAME = 'donarconnect-v1';
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(['/'])));
});
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((r) => {
      if (r) return r;
      return fetch(e.request).then((res) => {
        // If fetch returned an invalid response, treat as failure
        if (!res || res.status >= 400) throw new Error('Network response was not ok');
        return res;
      }).catch(() => {
        // On failure (offline or network error), return cached root as a fallback
        return caches.match('/');
      });
    })
  );
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))));
});
