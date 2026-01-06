const CACHE_NAME = 'vocab-clicker-v1';
const ASSETS = [
    './',
    './vocab_clicker_game.html',
    './icon.png',
    './manifest.json'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', (event) => {
    // Database requests should not be cached or should be handled by Firestore sdk
    if (event.request.url.includes('firebase') || event.request.url.includes('firestore')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                return response || fetch(event.request).catch(() => {
                    // Offline fallback?
                    // If offline and request is for navigation, return html
                    if (event.request.mode === 'navigate') {
                        return caches.match('./vocab_clicker_game.html');
                    }
                });
            })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) {
                    return caches.delete(key);
                }
            }));
        })
    );
});
