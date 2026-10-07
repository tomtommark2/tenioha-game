const { test, expect } = require('@playwright/test');

test('マイ単語帳：Service Workerの新版キャッシュにUI素材を登録できる', async ({ browser, baseURL }) => {
    const context = await browser.newContext({ serviceWorkers: 'allow' });
    const origin = new URL(baseURL).origin;
    await context.route('**/*', route => new URL(route.request().url()).origin === origin && route.request().method() === 'GET'
        ? route.continue() : route.abort());
    await context.addInitScript(() => {
        localStorage.setItem('vocabGame_skipWelcome', 'true');
        localStorage.setItem('vocabGame_disableAutoUpdate', 'true');
        localStorage.setItem('vocabGame_installGuideDismissed', 'true');
        localStorage.setItem('vocabGame_lastAutoShownAnnouncementId', '2026-10-04-noun-illustrations-complete');
    });
    try {
        const page = await context.newPage();
        await page.goto('/index.html');
        await page.evaluate(() => navigator.serviceWorker.register('./service_worker.js'));
        await expect.poll(() => page.evaluate(async () => {
            const registration = await navigator.serviceWorker.getRegistration();
            return registration?.active?.state;
        }), { timeout: 15000 }).toBe('activated');
        const cached = await page.evaluate(async () => {
            const cacheName = 'vocab-game-' + GAME_VERSION;
            const cache = await caches.open(cacheName);
            return { cacheName, paths: (await cache.keys()).map(request => new URL(request.url).pathname) };
        });
        expect(cached.paths).toHaveLength(32);
        expect(cached.paths).toContain('/wordbooks-m3e.css');
        expect(cached.paths).toContain('/assets/ui/roboto-flex-latin.woff2');
        expect(cached.paths).toContain('/assets/ui/menu-book-outline-rounded.svg');
        expect(cached.paths).toContain('/assets/ui/edit-note-rounded.svg');
    } finally {
        await context.close();
    }
});
