const { test, expect } = require('@playwright/test');
const data = require('../data/example-readings-junior.json');
const basic = require('../data/example-readings-basic.json');

test('実Service Worker：古いJS・中学310件・基礎100件から全件へ更新し、オフラインでも読める', async ({ browser, baseURL }, info) => {
    test.skip(info.project.name !== 'reading-desktop', 'Service Workerの実通信検査はChromiumで実施');
    test.setTimeout(60000);
    const context = await browser.newContext({ baseURL, serviceWorkers: 'allow' });
    try {
        await context.route('**/*', route => new URL(route.request().url()).origin === new URL(baseURL).origin ? route.continue() : route.abort());
        await context.addInitScript(() => {
            for (const name of ['skipWelcome', 'skipLiveTutorial', 'disableAutoUpdate', 'installGuideDismissed']) localStorage.setItem('vocabGame_' + name, 'true');
            const originalFetch = window.fetch.bind(window);
            window.fetch = (input, options) => String(input) === 'https://us-central1-tenioha-game.cloudfunctions.net/feedback'
                ? Promise.resolve(new Response(JSON.stringify({ items: [], isAdmin: false }), { headers: { 'Content-Type': 'application/json' } }))
                : originalFetch(input, options);
        });
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto('/index.html');
        await page.evaluate(async () => {
            await navigator.serviceWorker.register('./service_worker.js', { updateViaCache: 'none' });
            await navigator.serviceWorker.ready;
            if (!navigator.serviceWorker.controller) await new Promise(resolve => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }));
        });
        const urls = await page.evaluate(async ({ junior, basic }) => {
            const script = document.querySelector('script[src*="js/example_reading.js"]').src;
            const json = new URL('../data/example-readings-junior.json', script);
            json.search = new URL(script).search;
            const cache = await caches.open('vocab-game-' + GAME_VERSION);
            await cache.put(script, new Response('window.staleReadingScript = true;', { headers: { 'Content-Type': 'text/javascript' } }));
            await cache.put(json.href, new Response(JSON.stringify(junior), { headers: { 'Content-Type': 'application/json' } }));
            await cache.put(json.href.replace('-junior.json', '-basic.json'), new Response(JSON.stringify(basic), { headers: { 'Content-Type': 'application/json' } }));
            return { script, json: json.href };
        }, { junior: { ...data, entries: data.entries.slice(0, 310) }, basic: { ...basic, complete: false, entries: basic.entries.slice(0, 100) } });
        await page.reload();
        expect(await page.evaluate(() => window.staleReadingScript)).toBeUndefined();
        await page.evaluate(() => {
            gameState.currentLevel = 'junior';
            loadVocabularyForLevel();
            initializeWordStates();
            activateLearningSessionUI();
            showWord(vocabularyDatabase.junior.find(word => word.word === 'zoo'));
        });
        await expect(page.locator('#exampleReadingToggle')).toHaveText('読み方');
        await page.locator('#exampleReadingToggle').click();
        await expect(page.locator('#exampleReadingPanel')).toContainText('ライオンが');
        expect(await page.evaluate(async url => (await (await caches.match(url)).json()).entries.length, urls.json)).toBe(1527);
        await page.evaluate(() => {
            gameState.currentLevel = 'basic';
            loadVocabularyForLevel();
            initializeWordStates();
            showWord(vocabularyDatabase.basic.find(word => word.word === 'trouble'));
        });
        await expect(page.locator('#exampleReadingToggle')).toHaveText('読み方');
        await page.locator('#exampleReadingToggle').click();
        await expect(page.locator('#exampleReadingPanel')).toContainText('困った状態');
        expect(await page.evaluate(async url => (await (await caches.match(url.replace('-junior.json', '-basic.json'))).json()).entries.length, urls.json)).toBe(1520);
        await context.setOffline(true);
        expect(await page.evaluate(async url => (await (await fetch(url)).json()).entries.length, urls.json)).toBe(1527);
        expect(await page.evaluate(async url => (await (await fetch(url.replace('-junior.json', '-basic.json'))).json()).entries.length, urls.json)).toBe(1520);
        expect(errors).toEqual([]);
    } finally {
        await context.close();
    }
});
