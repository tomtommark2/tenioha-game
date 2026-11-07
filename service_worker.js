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
    './example-reading.css',
    './example-reading.css?v=' + GAME_VERSION,
    './js/example_reading.js',
    './js/example_reading.js?v=' + GAME_VERSION,
    './data/example-readings-junior.json?v=' + GAME_VERSION,
    './data/example-readings-basic.json?v=' + GAME_VERSION,
    './assets/icons/quote.svg',
    './assets/icons/volume-2.svg',
    './assets/icons/undo-2.svg',
    './wordbooks-m3e.css',
    './header-m3e.css',
    './header-m3e.css?v=' + GAME_VERSION,
    './daily-study.css',
    './daily-study.css?v=' + GAME_VERSION,
    './js/daily_study.js',
    './js/daily_study.js?v=' + GAME_VERSION,
    './assets/ui/bar-chart-rounded.svg',
    './assets/ui/schedule-rounded.svg',
    './assets/ui/settings-rounded.svg',
    './sister-apps.css',
    './sister-apps.css?v=' + GAME_VERSION,
    './js/sister_apps.js',
    './js/sister_apps.js?v=' + GAME_VERSION,
    './assets/sister-apps/dictionary-icon.png',
    './assets/sister-apps/sentence-icon.png',
    './assets/sister-apps/dictionary-promo-poster-v3.jpg',
    './assets/sister-apps/sentence-promo-poster-v1.jpg',
    './assets/ui/grid-view-rounded.svg',
    './assets/ui/open-in-new-rounded.svg',
    './assets/ui/roboto-flex-latin.woff2',
    './assets/ui/auto-stories-rounded.svg',
    './assets/ui/menu-book-outline-rounded.svg',
    './assets/ui/refresh-rounded.svg',
    './assets/ui/check-circle-rounded.svg',
    './assets/ui/auto-awesome-rounded.svg',
    './assets/ui/question-mark-rounded.svg',
    './assets/ui/visibility-rounded.svg',
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
    './js/app_check_client.js',
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

    // Reading content is edited independently during authoring. Revalidate once
    // per page load, keep the last successful copy for offline use, and never
    // replace it with an HTTP error. Other static assets keep their existing policy.
    const pathname = new URL(event.request.url).pathname;
    if (/\/data\/example-readings-(junior|basic)\.json$/.test(pathname)
        || pathname.endsWith('/js/example_reading.js')) {
        event.respondWith(
            fetch(event.request, { cache: 'no-cache' }).then(response => {
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const copy = response.clone();
                event.waitUntil(caches.open(CACHE_NAME)
                    .then(cache => cache.put(event.request, copy)).catch(() => {}));
                return response;
            }).catch(async error => {
                const cached = await caches.match(event.request);
                if (cached) return cached;
                throw error;
            })
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
