importScripts('./js/version.js');
// Cache key follows app version directly
const CACHE_NAME = 'vocab-game-' + GAME_VERSION;
const ASSETS = [
    './',
    './index.html',
    './vocab_clicker_game.html',
    './icon-512.png',
    './icon-192.png',
    './manifest.json',
    './scripts/qrcode.min.js',
    './style.css',
    './wordbooks-m3e.css',
    './header-m3e.css',
    './header-m3e.css?v=' + GAME_VERSION,
    './assets/ui/roboto-flex-latin.woff2',
    './assets/ui/auto-stories-rounded.svg',
    './assets/ui/menu-book-outline-rounded.svg',
    './assets/ui/refresh-rounded.svg',
    './assets/ui/check-circle-rounded.svg',
    './assets/ui/auto-awesome-rounded.svg',
    './assets/ui/school-outline-rounded.svg',
    './assets/ui/bookmark-outline-rounded.svg',
    './assets/ui/library-books-outline-rounded.svg',
    './assets/ui/chevron-right-rounded.svg',
    './assets/ui/arrow-forward-rounded.svg',
    './assets/ui/arrow-back-rounded.svg',
    './assets/ui/close-rounded.svg',
    './assets/ui/add-rounded.svg',
    './assets/ui/play-arrow-rounded.svg',
    './assets/ui/edit-note-rounded.svg',
    './js/game_logic.js',
    './js/word_grouping.js',
    './js/my_wordbooks.js',
    './js/config.js',
    './js/utils.js',
    './js/update_manager.js',
    './js/ui_manager.js',
    './js/firebase_app_v2.js',
    './data/vocabulary.js',
    './data/ipa_overrides.js'
];

self.addEventListener('install', (event) => {
    // Force immediate activation
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', (event) => {
    // Skip non-GET and Firebase traffic
    if (event.request.method !== 'GET') return;
    if (event.request.url.includes('firebase') || event.request.url.includes('firestore')) {
        return;
    }

    // Navigation requests: network-first (prevents stale HTML on normal reload)
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then((networkResponse) => {
                    const copy = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
                    return networkResponse;
                })
                .catch(() => caches.match(event.request).then((r) => r || caches.match('./index.html') || caches.match('./vocab_clicker_game.html')))
        );
        return;
    }

    // Static assets: cache-first + network fallback
    event.respondWith(
        caches.match(event.request)
            .then((response) => response || fetch(event.request))
    );
});

self.addEventListener('activate', (event) => {
    // Force this SW to become the controller for all clients
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) {
                    return caches.delete(key);
                }
            }));
        }).then(() => self.clients.claim())
    );
});

// Manual update trigger from UI
self.addEventListener('message', (event) => {
    if (event && event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
