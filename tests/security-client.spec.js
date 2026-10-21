const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page, context }) => {
    await context.route('**/*', route => {
        const url = new URL(route.request().url());
        if (url.pathname.endsWith('/js/firebase_app_v2.js')) return route.fulfill({ contentType: 'application/javascript', body: 'window.firebaseAuth = { currentUser: null };' });
        if (['localhost', '127.0.0.1'].includes(url.hostname)) return route.continue();
        return route.abort('blockedbyclient');
    });
    await page.addInitScript(() => {
        localStorage.setItem('vocabGame_skipWelcome', 'true');
        localStorage.setItem('vocabGame_skipLiveTutorial', 'true');
        localStorage.setItem('vocabGame_disableAutoUpdate', 'true');
    });
});

for (const status of [403, 429, 503]) {
    test(`セキュリティ：購入APIの${status}は外部決済へ自動迂回しない`, async ({ page }) => {
        let requests = 0;
        const messages = [], errors = [];
        page.on('pageerror', error => errors.push(error.message));
        page.on('dialog', async dialog => { messages.push(dialog.message()); await dialog.accept(); });
        await page.route('**/createStripeCheckoutSession', route => {
            requests++;
            expect(route.request().headers()['x-firebase-appcheck']).toBe('fixture-app-check');
            return route.fulfill({ status, json: { error: '時間をおいてお試しください。' } });
        });
        await page.goto('/index.html');
        await page.evaluate(() => {
            window.firebaseAuth.currentUser = { uid: 'fixture-member', isAnonymous: false, getIdToken: async () => 'fixture-id-token' };
            window.isRegisteredFirebaseUser = () => true;
            window.teniohaAppCheckClient = { headers: async () => ({ 'X-Firebase-AppCheck': 'fixture-app-check' }) };
            window.openPurchaseModal();
        });
        await expect(page.locator('#purchaseModal')).toBeVisible();
        const before = page.url();
        await page.locator('#stripePurchaseLink').click();
        await expect.poll(() => messages.length).toBe(1);
        expect(messages[0]).toBe('時間をおいてお試しください。');
        expect(requests).toBe(1);
        expect(page.url()).toBe(before);
        await expect(page.locator('#stripePurchaseLink')).not.toHaveAttribute('aria-busy');
        expect(errors).toEqual([]);
    });
}

test('セキュリティ：ひとことの公開読取もApp Checkヘッダーを送る', async ({ page }) => {
    let headers;
    await page.route('**/feedback', route => {
        headers = route.request().headers();
        return route.fulfill({ json: { items: [], isAdmin: false } });
    });
    await page.goto('/index.html');
    await page.evaluate(() => {
        window.teniohaAppCheckClient = { headers: async () => ({ 'X-Firebase-AppCheck': 'fixture-app-check' }) };
        window.openFeedback();
    });
    await expect(page.locator('#feedbackList')).toContainText('まだ投稿はありません');
    expect(headers['x-firebase-appcheck']).toBe('fixture-app-check');
    expect(headers.authorization).toBeUndefined();
});
