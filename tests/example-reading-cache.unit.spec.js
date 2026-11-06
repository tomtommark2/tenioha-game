const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('例文補助の実際の取得URLとアイコンをオフライン・版管理へ登録する', () => {
    const root = path.resolve(__dirname, '..');
    const read = file => fs.readFileSync(path.join(root, file), 'utf8');
    const version = read('js/version.js').match(/GAME_VERSION\s*=\s*["']([^"']+)/)[1];
    const assets = vm.runInNewContext(`${read('service_worker.js')}\nASSETS`, {
        importScripts() {}, GAME_VERSION: version, self: { addEventListener() {} }
    });
    for (const file of ['example-reading.css', 'js/example_reading.js', 'data/example-readings-junior.json']) {
        expect(assets).toContain(`./${file}?v=${version}`);
        expect(fs.existsSync(path.join(root, file))).toBe(true);
    }
    for (const file of ['assets/icons/quote.svg', 'assets/icons/undo-2.svg', 'assets/icons/volume-2.svg', 'assets/ui/chevron-right-rounded.svg']) {
        expect(assets).toContain(`./${file}`);
        expect(fs.existsSync(path.join(root, file))).toBe(true);
    }
    for (const file of ['example-reading.css', 'js/example_reading.js']) {
        for (const script of ['scripts/bump-version.js', 'scripts/check-version-sync.js']) expect(read(script)).toContain(`'${file}'`);
    }
    expect(read('js/example_reading.js')).toContain('dataUrl.search = scriptUrl.search');
});

function worker(network) {
    const handlers = {};
    const saved = new Map();
    const requests = [];
    vm.runInNewContext(fs.readFileSync(path.resolve('service_worker.js'), 'utf8'), {
        GAME_VERSION: 'test', importScripts() {}, URL,
        self: { addEventListener: (type, callback) => { handlers[type] = callback; } },
        fetch: async (request, options) => { requests.push({ request, options }); return network(request); },
        caches: {
            match: async request => saved.get(request.url)?.clone(),
            open: async () => ({ put: async (request, response) => { saved.set(request.url, response.clone()); } })
        }
    });
    return { saved, requests, async get(url) {
        const waits = [];
        let result;
        handlers.fetch({ request: { url, method: 'GET', mode: 'cors' },
            respondWith(promise) { result = promise; }, waitUntil(promise) { waits.push(promise); } });
        const response = await result;
        await Promise.all(waits);
        return response;
    } };
}

test('古い読み方JSON・JSを再検証し、成功した内容だけをキャッシュする', async () => {
    const sw = worker(() => new Response('current'));
    for (const asset of ['data/example-readings-junior.json', 'js/example_reading.js']) {
        const url = `https://example.test/app/${asset}?v=test`;
        sw.saved.set(url, new Response('stale'));
        expect(await (await sw.get(url)).text()).toBe('current');
        expect(await sw.saved.get(url).text()).toBe('current');
        expect(sw.requests.at(-1).options.cache).toBe('no-cache');
    }
    expect(sw.requests).toHaveLength(2);
    const css = 'https://example.test/app/style.css?v=test';
    sw.saved.set(css, new Response('cached CSS'));
    expect(await (await sw.get(css)).text()).toBe('cached CSS');
    expect(sw.requests).toHaveLength(2);
});

for (const failure of ['offline', 'HTTP 503']) {
    test(`${failure}では成功済みの読み方を返し、エラーで上書きしない`, async () => {
        const sw = worker(() => {
            if (failure === 'offline') throw new Error('Offline');
            return new Response('error', { status: 503 });
        });
        const url = 'https://example.test/app/data/example-readings-junior.json?v=test';
        sw.saved.set(url, new Response('last good data'));
        expect(await (await sw.get(url)).text()).toBe('last good data');
        expect(await sw.saved.get(url).text()).toBe('last good data');
        await expect(sw.get(url + '-uncached')).rejects.toThrow();
        expect(sw.requests).toHaveLength(2);
    });
}
