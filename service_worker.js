importScripts('./js/version.js');
const CACHE_NAME = 'vocab-clicker-' + GAME_VERSION;
const ASSETS = [
    './',
    './vocab_clicker_game.html',
    './icon-512.png',
    './icon-192.png',
    './manifest.json',
    './scripts/qrcode.min.js',
    './style.css',
    './js/game_logic.js',
    './js/config.js',
    './js/utils.js',
    './js/ui_manager.js',
    './js/chart_fallback.js',
    './js/firebase_app_v2.js',
    './data/vocabulary.js'
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
