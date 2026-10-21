const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('js/app_check_client.js', 'utf8');
function client(options) {
    const context = { window: { location: { hostname: 'example.invalid' } }, Promise, setTimeout, clearTimeout };
    vm.runInNewContext(source, context);
    return context.window.createTeniohaAppCheckClient({ timeoutMs: 10, ...options });
}

test('App Check準備：キー未設定とローカル開発ではSDKもトークンも取得しない', async () => {
    for (const options of [{ siteKey: '' }, { siteKey: 'fixture', localDevelopment: true }]) {
        let loads = 0;
        const value = client({ ...options, loadSdk: async () => { loads++; } });
        expect(await value.initialize({})).toBe(false);
        expect(await value.headers()).toEqual({});
        expect(loads).toBe(0);
    }
});

test('App Check準備：SDKを一度初期化し自動更新を有効にしてHTTPヘッダーへ渡す', async () => {
    let loads = 0, initialized = 0;
    const app = {}, instance = {};
    const value = client({ siteKey: 'fixture', loadSdk: async () => {
        loads++;
        return { ReCaptchaEnterpriseProvider: class { constructor(key) { this.key = key; } },
            initializeAppCheck: (actualApp, options) => {
                initialized++;
                expect(actualApp).toBe(app);
                expect(options.provider.key).toBe('fixture');
                expect(options.isTokenAutoRefreshEnabled).toBe(true);
                return instance;
            }, getToken: async (actual, refresh) => {
                expect(actual).toBe(instance); expect(refresh).toBe(false); return { token: 'fixture-token' };
            } };
    } });
    expect(await value.headers()).toEqual({});
    expect(await value.initialize(app)).toBe(true);
    expect(await value.initialize(app)).toBe(true);
    expect(await value.headers()).toEqual({ 'X-Firebase-AppCheck': 'fixture-token' });
    expect(loads).toBe(1); expect(initialized).toBe(1);
});

test('App Check準備：SDK読込とトークン停止・失敗でも基本アプリを無期限に待たせない', async () => {
    const slow = client({ siteKey: 'fixture', loadSdk: () => new Promise(() => {}) });
    expect(await slow.initialize({})).toBe(false);
    expect(await slow.headers()).toEqual({});
    for (const getToken of [() => new Promise(() => {}), async () => { throw new Error('private verifier error'); }]) {
        const value = client({ siteKey: 'fixture', loadSdk: async () => ({
            ReCaptchaEnterpriseProvider: class {}, initializeAppCheck: () => ({}), getToken }) });
        await value.initialize({});
        expect(await value.headers()).toEqual({});
    }
});

test('App Check準備：壊れたトークンはヘッダーにせず、次の取得は回復できる', async () => {
    let token = '';
    const value = client({ siteKey: 'fixture', loadSdk: async () => ({ ReCaptchaEnterpriseProvider: class {},
        initializeAppCheck: () => ({}), getToken: async () => ({ token }) }) });
    await value.initialize({});
    for (const invalid of ['', 'x'.repeat(8193), null, {}]) { token = invalid; expect(await value.headers()).toEqual({}); }
    token = 'recovered';
    expect(await value.headers()).toEqual({ 'X-Firebase-AppCheck': 'recovered' });
});

test('App Check準備：クライアント資源をHTML・版管理・キャッシュに含める', () => {
    const html = fs.readFileSync('index.html', 'utf8');
    expect(html.indexOf('js/app_check_client.js')).toBeLessThan(html.indexOf('src="js/firebase_app_v2.js'));
    for (const file of ['scripts/bump-version.js', 'scripts/check-version-sync.js', 'service_worker.js']) {
        expect(fs.readFileSync(file, 'utf8')).toContain('js/app_check_client.js');
    }
});
