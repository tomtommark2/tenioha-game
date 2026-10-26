const { test, expect } = require('@playwright/test');
const errors = new WeakMap();
const button = page => page.getByRole('button', { name: 'ほかの学習アプリ', exact: true, includeHidden: true });
const panel = page => page.getByRole('dialog', { name: 'ほかの学習アプリ' });

test.beforeEach(async ({ page, context }) => {
    errors.set(page, []);
    page.on('pageerror', error => errors.get(page).push(error.message));
    await context.route('**/*', route => {
        const url = new URL(route.request().url());
        if (['localhost', '127.0.0.1', 'fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname)) return route.continue();
        if (url.hostname === 'us-central1-tenioha-game.cloudfunctions.net' && url.pathname === '/feedback') {
            return route.fulfill({ contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ items: [], isAdmin: false }) });
        }
        if (['phrasalverbapp-d5fa7.web.app', 'grammar-zukan.web.app'].includes(url.hostname)) {
            return route.fulfill({ contentType: 'text/html', body: '<title>Local link check</title>' });
        }
        return route.abort('blockedbyclient');
    });
    await page.addInitScript(() => {
        localStorage.setItem('vocabGame_skipWelcome', 'true');
        localStorage.setItem('vocabGame_skipLiveTutorial', 'true');
        localStorage.setItem('vocabGame_disableAutoUpdate', 'true');
        localStorage.setItem('vocabGame_installGuideDismissed', 'true');
        localStorage.setItem('vocabGame_speechSettings', JSON.stringify({ autoRead: false, volume: 0 }));
    });
    await page.goto('/index.html');
    await expect(page.locator('#vocabWord')).toHaveText('クリックしてスタート');
    await expect(page.locator('#otherMenuBtn')).toBeVisible();
    await expect(button(page)).toBeHidden();
    await page.evaluate(() => document.fonts.ready);
});
test.afterEach(async ({ page }) => { expect(errors.get(page)).toEqual([]); });

async function open(page) {
    if (!await button(page).isVisible()) await page.locator('#otherMenuBtn').click();
    await button(page).click();
    await expect(panel(page)).toBeVisible();
    await expect(page.locator('#otherMenuDropdown')).toBeHidden();
    await expect(button(page)).toHaveAttribute('aria-expanded', 'true');
    for (const image of await panel(page).locator('img').all()) await image.evaluate(img => img.decode());
    await page.evaluate(() => document.fonts.ready);
}
async function closed(page) {
    await expect(panel(page)).toBeHidden();
    await expect(button(page)).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#otherMenuBtn')).toBeFocused();
    await expect.poll(() => page.evaluate(() => Boolean(history.state?.__teniohaModalLayer))).toBe(false);
}
const positions = page => page.evaluate(() => ['.learning-header', '#heroCharacter', '.learning-header .mode-buttons',
    '#reviewProgressWrap', '#reviewQueuePreview', '#cardsArea'].map(selector => {
    const { x, y, width, height } = document.querySelector(selector).getBoundingClientRect();
    return { selector, x, y, width, height };
}));
const learning = page => page.evaluate(() => JSON.stringify({ word: gameState.currentWord, states: gameState.wordStates,
    srs: gameState.srsData, score: gameState.reviewScore, count: gameState.globalQuestionCount,
    flipped: gameState.meaningCardFlipped, mode: gameState.reviewMode, undo: gameStateHistory,
    saved: localStorage.getItem('vocabClickerSave'), shuffled: localStorage.getItem('vocabGame_reviewQueueShuffle_v1') }));

test('姉妹アプリ：320〜1280pxで画面を広く使い、開閉で学習画面をずらさない', async ({ page }, testInfo) => {
    test.setTimeout(60000);
    for (const width of [320, 381, 389, 390, 568, 768, 769, 880, 1280]) {
        await page.setViewportSize({ width, height: 844 });
        await page.locator('#levelCurrentLabel').evaluate(e => { e.textContent = 'イラスト'; });
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        const before = await positions(page);
        const controls = await page.evaluate(() => {
            const rect = e => { const { left, right, top, bottom, width, height } = e.getBoundingClientRect(); return { left, right, top, bottom, width, height }; };
            return { left: rect(document.getElementById('otherMenuBtn')), level: rect(document.getElementById('levelCurrentBtn')),
                buttons: [...document.querySelectorAll('.header-controls > *')].filter(e => e.getClientRects().length).map(rect) };
        });
        expect(controls.buttons[0].left).toBeGreaterThanOrEqual(controls.left.right + 4);
        const levelFits = controls.level.bottom <= controls.buttons[0].top || controls.level.top >= controls.buttons[0].bottom
            || controls.level.right <= controls.buttons[0].left - 3;
        if (!levelFits) await page.screenshot({ path: `screenshots/sister-apps-20261014/overlap-before-fix-${width}-${testInfo.project.name}.png`, scale: 'css' });
        expect(levelFits, `${width}px level and timer: ${JSON.stringify(controls)}`).toBe(true);
        for (let i = 1; i < controls.buttons.length; i++) expect(controls.buttons[i].left).toBeGreaterThanOrEqual(controls.buttons[i - 1].right + 3);
        await page.locator('#otherMenuBtn').click();
        const menuEntry = await button(page).evaluate(entry => {
            const rect = e => e.getBoundingClientRect().toJSON();
            const icon = entry.querySelector('img');
            return { row: rect(entry), icon: rect(icon), label: rect(entry.querySelector('.other-menu-label')),
                previous: entry.previousElementSibling.textContent.trim(),
                headerEntries: document.querySelectorAll('.header-controls #sisterAppsBtn').length,
                icons: entry.querySelectorAll('img').length, loaded: icon.complete && icon.naturalWidth > 0,
                before: getComputedStyle(icon, '::before').content, after: getComputedStyle(icon, '::after').content };
        });
        expect(menuEntry.previous).toBe('ランキング');
        expect(menuEntry.headerEntries).toBe(0);
        expect(menuEntry.icons).toBe(1);
        expect(menuEntry.loaded).toBe(true);
        expect(menuEntry.before).toBe('none');
        expect(menuEntry.after).toBe('none');
        expect(menuEntry.row.height).toBeGreaterThanOrEqual(44);
        expect(menuEntry.icon.right + 10).toBeLessThanOrEqual(menuEntry.label.left);
        expect(menuEntry.row.right).toBeLessThanOrEqual(width);
        if ([320, 390, 1280].includes(width)) await page.screenshot({ path: `screenshots/header-menu-20261026-${width}-${testInfo.project.name}.png` });
        await open(page);
        expect(await positions(page)).toEqual(before);
        const bounds = await panel(page).boundingBox();
        if (width <= 768) {
            expect(bounds.x).toBeCloseTo(0, 2);
            expect(bounds.y).toBeCloseTo(0, 2);
            expect(bounds.width).toBeCloseTo(width, 2);
            // WebKit's dynamic viewport uses fractional layout pixels.
            expect(bounds.height).toBeCloseTo(844, 1);
        } else {
            expect(bounds.x).toBeGreaterThanOrEqual(24);
            expect(bounds.x + bounds.width).toBeLessThanOrEqual(width - 24);
            expect(bounds.y).toBeGreaterThanOrEqual(24);
            expect(bounds.y + bounds.height).toBeLessThanOrEqual(820);
        }
        const previews = await panel(page).locator('.sister-apps-media').evaluateAll(elements => elements.map(e => e.getBoundingClientRect().toJSON()));
        const cards = await panel(page).locator('.sister-apps-link').evaluateAll(elements => elements.map(e => e.getBoundingClientRect().toJSON()));
        for (const [index, preview] of previews.entries()) {
            expect(preview.x).toBeGreaterThanOrEqual(cards[index].x + 14);
            expect(preview.x + preview.width).toBeLessThanOrEqual(cards[index].x + cards[index].width - 14);
        }
        if (width <= 768) expect(previews[1].y).toBeGreaterThanOrEqual(previews[0].y + previews[0].height);
        else expect(previews[1].y).toBeCloseTo(previews[0].y, 2);
        await expect(page.getByRole('button', { name: '紹介を閉じる' })).toBeInViewport();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await page.screenshot({ path: `screenshots/sister-apps-promo-20261014/panel-${width}-${testInfo.project.name}.png`, scale: 'css' });
        await page.getByRole('button', { name: '紹介を閉じる' }).click();
        await closed(page);
        expect(await positions(page)).toEqual(before);
    }
});

test('姉妹アプリ：2件の実アイコン・短い説明を表示し、別タブへ安全に移動する', async ({ page, context }) => {
    await open(page);
    await expect(panel(page).locator('a')).toHaveCount(2);
    await expect(panel(page).locator('.sister-apps-card-heading strong')).toHaveText(['動く！図鑑', '英文図解']);
    for (const [index, url] of ['https://phrasalverbapp-d5fa7.web.app/', 'https://grammar-zukan.web.app/'].entries()) {
        const link = panel(page).locator('a').nth(index);
        await expect(link).toHaveAttribute('href', url);
        await expect(link).toHaveAttribute('target', '_blank');
        await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
        await expect(link.locator('.sister-apps-media img')).toHaveAttribute('alt', /教材|実画面/);
        await expect(link.locator('.sister-apps-cta')).toHaveText('アプリを開く');
        for (const image of await link.locator('img').all()) await image.evaluate(img => img.decode());
        const popupPromise = context.waitForEvent('page');
        await link.click();
        const popup = await popupPromise;
        await popup.waitForLoadState();
        expect(popup.url()).toBe(url);
        expect(await popup.evaluate(() => window.opener === null)).toBe(true);
        await popup.close();
        await expect(panel(page)).toBeVisible();
    }
    await page.getByRole('button', { name: '紹介を閉じる' }).click();
    await closed(page);
    // Access to this panel is independent of the welcome/login/purchase overlays.
    await page.goto('/vocab_clicker_game.html');
    await open(page);
    await expect(panel(page).locator('a')).toHaveCount(2);
    await expect(page.locator('#purchaseModal')).toBeHidden();
    await page.getByRole('button', { name: '紹介を閉じる' }).click();
    await closed(page);
    await page.evaluate(() => {
        localStorage.setItem('vocabGame_isUnlocked', 'true');
        localStorage.setItem('vocabGame_expiry', String(Date.now() + 86400000));
        updateTrialTimer();
    });
    await open(page);
    await expect(panel(page).locator('.sister-apps-card-heading strong')).toHaveText(['動く！図鑑', '英文図解']);
});

test('姉妹アプリ：Enter・Spaceで開き、×・外側・Escape・戻るで閉じ、フォーカスを戻す', async ({ page }) => {
    await page.locator('#otherMenuBtn').click();
    await button(page).focus();
    await button(page).press('Enter');
    await expect(panel(page)).toBeVisible();
    const close = page.getByRole('button', { name: '紹介を閉じる' });
    await expect(close).toBeFocused();
    await close.press('Shift+Tab');
    await expect(panel(page).locator('.sister-apps-motion-toggle').last()).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(close).toBeFocused();
    await page.keyboard.press('Escape');
    await closed(page);
    await page.locator('#otherMenuBtn').click();
    await button(page).focus();
    await button(page).press('Space');
    await expect(panel(page)).toBeVisible();
    await close.click();
    await closed(page);
    // Fullscreen on mobile deliberately has no tappable backdrop; verify it on desktop.
    await page.setViewportSize({ width: 880, height: 844 });
    await open(page);
    await page.locator('#sisterAppsModal').click({ position: { x: 2, y: 2 } });
    await closed(page);
    await open(page);
    await page.goBack();
    await closed(page);
});

test('姉妹アプリ：101語の復習案内・復習中・初回説明を保持し、回答や保存を発生させない', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 844 });
    await page.goto('/index.html?tutorialPreview=1');
    await expect(page.locator('#vocabWord')).toHaveText('クリックしてスタート');
    await page.evaluate(() => {
        gameState.currentLevel = 'basic'; gameState.currentMode = 'unlearned'; gameState.reviewMode = 'off';
        gameState.wordStates = {}; gameState.srsData = {}; gameState.decks = null; gameState.activeReviewLevels = ['basic'];
        const words = [...new Map(vocabularyDatabase.basic.map(w => [getWordKeySafe(w, 'basic'), w])).values()].slice(0, 101);
        words.forEach(w => {
            const key = getWordKeySafe(w, 'basic'); gameState.wordStates[key] = 'weak';
            gameState.srsData[key] = { dueAt: Date.now() - 1000, reviewStep: 1, scheduledIntervalDays: 1,
                recentAnswers: [false], successCount: 0, failCount: 1, everWrong: true };
        });
        loadVocabularyForLevel(); invalidateLearningProgressSnapshot(); activateLearningSessionUI();
        setReviewRecommendationEnabled(true); showNextWord(updateDisplay());
    });
    await expect(page.locator('#reviewRecommendation')).toBeVisible();
    await expect(page.locator('.card-tutorial-note').first()).toBeVisible();
    for (const mode of ['off', 'on']) {
        await page.evaluate(mode => { gameState.reviewMode = mode; updateModeButtons(); }, mode);
        const state = await learning(page);
        const before = await positions(page);
        const writes = [];
        const record = request => {
            if (['GET', 'HEAD', 'OPTIONS'].includes(request.method())) return;
            // The independent unread check uses POST for a read-only list request.
            if (request.url().endsWith('/feedback') && request.postDataJSON()?.action === 'list') return;
            writes.push(request.url());
        };
        page.on('request', record);
        await open(page);
        expect(await positions(page)).toEqual(before);
        await page.getByRole('button', { name: '紹介を閉じる' }).click();
        await closed(page);
        expect(await learning(page)).toBe(state);
        expect(await positions(page)).toEqual(before);
        expect(writes).toEqual([]);
        page.off('request', record);
    }
});

test('姉妹アプリ：開いたままの幅変更・大きい文字・低い画面で切れずに操作できる', async ({ page }) => {
    await open(page);
    await page.setViewportSize({ width: 320, height: 360 });
    await page.addStyleTag({ content: '.sister-apps-heading h2 {font-size:40px} .sister-apps-intro p {font-size:26px} .sister-apps-copy strong {font-size:34px} .sister-apps-copy span {font-size:26px} .sister-apps-cta {font-size:28px}' });
    await expect(panel(page)).toBeVisible();
    await expect(page.getByRole('button', { name: '紹介を閉じる' })).toBeInViewport();
    const bounds = await panel(page).boundingBox();
    expect(bounds.x).toBeCloseTo(0, 2);
    expect(bounds.width).toBeCloseTo(320, 2);
    expect(bounds.y + bounds.height).toBeCloseTo(360, 1);
    expect(await panel(page).evaluate(e => e.scrollWidth <= e.clientWidth)).toBe(true);
    expect(await page.locator('.sister-apps-body').evaluate(e => e.scrollWidth <= e.clientWidth)).toBe(true);
    await panel(page).locator('a').last().focus();
    await expect(panel(page).locator('a').last()).toBeInViewport();
    await panel(page).locator('.sister-apps-cta').last().scrollIntoViewIfNeeded();
    await expect(panel(page).locator('.sister-apps-cta').last()).toBeInViewport();
    await expect(page.getByRole('button', { name: '紹介を閉じる' })).toBeInViewport();
    await page.keyboard.press('Escape');
    await closed(page);
});

test('姉妹アプリ：短いスマホでも2つの紹介とCTAを縦に読み、閉じる操作を常に使える', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await open(page);
    expect(await page.locator('.sister-apps-body').evaluate(e => e.scrollHeight > e.clientHeight)).toBe(true);
    const cta = panel(page).locator('.sister-apps-cta').last();
    await cta.scrollIntoViewIfNeeded();
    await expect(cta).toBeInViewport({ ratio: 1 });
    await expect(page.getByRole('button', { name: '紹介を閉じる' })).toBeInViewport({ ratio: 1 });
    expect(await cta.evaluate(e => {
        const r = e.getBoundingClientRect();
        return e.closest('a').contains(document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2));
    })).toBe(true);
    await page.screenshot({ path: `screenshots/sister-apps-promo-20261014/scrolled-320-${testInfo.project.name}.png`, scale: 'css' });
    await page.getByRole('button', { name: '紹介を閉じる' }).click();
    await closed(page);
});

test('姉妹アプリ：短い無音動画を開いた時だけ再生し、停止操作はアプリを開かない', async ({ page, context }) => {
    await page.setViewportSize({ width: 880, height: 844 });
    const videos = panel(page).locator('video');
    expect(await videos.evaluateAll(elements => elements.every(e => !e.getAttribute('src')))).toBe(true);
    const before = await learning(page);
    await open(page);
    await expect.poll(() => videos.evaluateAll(elements => elements.every(e => !e.paused && e.readyState >= 2))).toBe(true);
    const metadata = await videos.evaluateAll(elements => elements.map(e => ({ duration: e.duration,
        muted: e.muted, loop: e.loop, inline: e.playsInline, width: e.videoWidth, height: e.videoHeight })));
    expect(metadata[0].duration).toBeCloseTo(13.7, 1);
    expect(metadata[1].duration).toBeCloseTo(5.4, 1);
    for (const data of metadata) { expect(data.muted && data.loop && data.inline).toBe(true); expect(data.width).toBeGreaterThan(0); }
    const toggle = panel(page).locator('.sister-apps-motion-toggle').first();
    const pages = context.pages().length;
    await expect(toggle).toHaveAccessibleName('動く！図鑑の紹介動画を停止');
    await toggle.click();
    await expect.poll(() => videos.first().evaluate(e => e.paused)).toBe(true);
    await expect(toggle).toHaveAccessibleName('動く！図鑑の紹介動画を再生');
    expect(context.pages().length).toBe(pages);
    await toggle.click();
    await expect.poll(() => videos.first().evaluate(e => !e.paused)).toBe(true);
    await page.getByRole('button', { name: '紹介を閉じる' }).click();
    await closed(page);
    expect(await videos.evaluateAll(elements => elements.every(e => e.paused))).toBe(true);
    expect(await learning(page)).toBe(before);
});

test('姉妹アプリ：動きを減らす設定では静止画を表示し、本人の再生操作だけで動く', async ({ page }) => {
    await page.setViewportSize({ width: 880, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page);
    const videos = panel(page).locator('video');
    expect(await videos.evaluateAll(elements => elements.every(e => e.paused && !e.getAttribute('src')))).toBe(true);
    await expect(panel(page).getByRole('button', { name: '動く！図鑑の紹介動画を再生' })).toBeVisible();
    for (const image of await panel(page).locator('.sister-apps-media img').all()) expect(await image.evaluate(e => e.naturalWidth > 0)).toBe(true);
    await panel(page).getByRole('button', { name: '動く！図鑑の紹介動画を再生' }).click();
    await expect.poll(() => videos.first().evaluate(e => !e.paused)).toBe(true);
    expect(await videos.last().evaluate(e => e.paused && !e.getAttribute('src'))).toBe(true);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await expect.poll(() => videos.evaluateAll(elements => elements.every(e => !e.paused))).toBe(true);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect.poll(() => videos.evaluateAll(elements => elements.every(e => e.paused))).toBe(true);
});

test('姉妹アプリ：スマホの画面外は停止し、手動停止はスクロールや再開で解除しない', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await open(page);
    const videos = panel(page).locator('video');
    const toggles = panel(page).locator('.sister-apps-motion-toggle');
    await expect.poll(() => videos.first().evaluate(e => !e.paused)).toBe(true);
    expect(await videos.last().evaluate(e => e.paused)).toBe(true);
    await toggles.first().click();
    await panel(page).locator('.sister-apps-media').last().scrollIntoViewIfNeeded();
    await expect.poll(() => videos.last().evaluate(e => !e.paused)).toBe(true);
    expect(await videos.first().evaluate(e => e.paused)).toBe(true);
    // Bringing the first frame into view may leave part of the second frame visible.
    await page.locator('.sister-apps-body').evaluate(e => { e.scrollTop = 0; });
    await expect.poll(() => videos.last().evaluate(e => e.paused)).toBe(true);
    expect(await videos.first().evaluate(e => e.paused)).toBe(true);
    await page.keyboard.press('Escape');
    await closed(page);
    await open(page);
    expect(await videos.first().evaluate(e => e.paused)).toBe(true);
});

test('姉妹アプリ：動画が読めなくても完成図とアプリへのリンクを残す', async ({ page }) => {
    await open(page);
    const card = panel(page).locator('.sister-apps-card').first();
    // WebKit's native media loader can bypass request routing. Exercise a real decode error.
    await card.locator('video').evaluate(e => { e.src = 'data:video/mp4;base64,AA=='; e.load(); });
    await expect(card.locator('.sister-apps-motion-toggle')).toBeDisabled();
    await expect(card.locator('video')).toBeHidden();
    await expect(card.locator('.sister-apps-media img')).toBeVisible();
    await expect(card.locator('.sister-apps-example')).toHaveText('UP');
    expect(await card.locator('.sister-apps-media img').evaluate(e => e.naturalWidth > 0)).toBe(true);
    await expect(card.locator('a')).toHaveAttribute('href', 'https://phrasalverbapp-d5fa7.web.app/');
    await expect(card.locator('.sister-apps-cta')).toHaveText('アプリを開く');
});

test('姉妹アプリ：動画の実画像が変わり、開き直しと次の周でも描画される', async ({ page }) => {
    test.setTimeout(40000);
    await page.setViewportSize({ width: 880, height: 844 });
    await open(page);
    const cards = panel(page).locator('.sister-apps-card');
    const video = cards.first().locator('video');
    const word = cards.first().locator('.sister-apps-example strong');
    const imageHash = async locator => {
        const rect = await locator.boundingBox();
        // Exclude the independently animated HTML caption and playback control.
        const pixels = await page.screenshot({ clip: {
            x: rect.x + 8, y: rect.y + rect.height * .34,
            width: rect.width - 16, height: rect.height * .6
        } });
        return require('node:crypto').createHash('sha256').update(pixels).digest('hex');
    };
    await expect.poll(() => video.evaluate(e => e.readyState >= 2 && e.currentTime > .15 && e.currentTime < 2.4)).toBe(true);
    const up = await imageHash(video);
    const sentenceStart = await imageHash(cards.last().locator('video'));
    await expect(word).toHaveText('EVEN', { timeout: 7000 });
    await expect.poll(() => video.evaluate(e => e.currentTime > 3.1)).toBe(true);
    const even = await imageHash(video);
    expect(even, 'The rendered diagram must change, not only its caption or media clock').not.toBe(up);
    expect(await imageHash(cards.last().locator('video')), 'The sentence structure must visibly animate').not.toBe(sentenceStart);
    await page.getByRole('button', { name: '紹介を閉じる' }).click();
    await closed(page);
    await open(page);
    await expect(word).toHaveText('THERE IS', { timeout: 7000 });
    await expect.poll(() => video.evaluate(e => e.currentTime > 7.6)).toBe(true);
    const thereIs = await imageHash(video);
    expect(thereIs).not.toBe(even);
    expect(thereIs).not.toBe(up);
    await expect(word).toHaveText('DARE', { timeout: 7000 });
    await expect.poll(() => video.evaluate(e => e.currentTime > 9.8)).toBe(true);
    const dare = await imageHash(video);
    expect(dare).not.toBe(thereIs);
    await expect(word).toHaveText('UP', { timeout: 7000 });
    await expect.poll(() => video.evaluate(e => e.currentTime > .4 && e.currentTime < 2.4)).toBe(true);
    expect(await imageHash(video), 'The next cycle must render a new picture').not.toBe(dare);
});

test('姉妹アプリ：4場面の見出しが動画に合い、巻戻りと静止画でも一致する', async ({ page }) => {
    test.setTimeout(40000);
    await page.setViewportSize({ width: 320, height: 568 });
    await open(page);
    const card = panel(page).locator('.sister-apps-card').first();
    const video = card.locator('video');
    await expect.poll(() => video.evaluate(e => e.readyState >= 2 && !e.paused)).toBe(true);
    // Observe actual playback: the standard test server does not support range seeking.
    for (const [word, caption] of [['UP', ''], ['EVEN', '驚き・予想外の強調'],
        ['THERE IS', '話題に出す'], ['DARE', 'あえて一歩踏み込む']]) {
        await expect(card.locator('.sister-apps-example > span')).toHaveText(caption, { timeout: 7000 });
        await expect(card.locator('.sister-apps-example strong')).toHaveText(word);
        expect(await card.locator('.sister-apps-example').evaluate(e => {
            const r = e.getBoundingClientRect(), m = e.parentElement.getBoundingClientRect();
            return r.left >= m.left && r.right <= m.right && r.bottom < m.top + m.height * .4;
        })).toBe(true);
    }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(video).toBeHidden();
    await expect(card.locator('.sister-apps-example')).toHaveText('UP');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await expect(card.locator('.sister-apps-example strong')).toHaveText('DARE');
    await expect(card.locator('.sister-apps-example strong')).toHaveText('UP', { timeout: 7000 });
});

for (const nativeLoop of [true, false]) {
    test(`姉妹アプリ：${nativeLoop ? '通常' : '終端フォールバック'}の再生で3周目も動き続け、手動停止と閉じるを尊重する`, async ({ page }) => {
        test.setTimeout(65000);
        await page.setViewportSize({ width: 880, height: 844 });
        await open(page);
        const videos = panel(page).locator('video');
        await expect.poll(() => videos.evaluateAll(elements => elements.every(e => !e.paused && e.readyState >= 2))).toBe(true);
        const loopTimeout = await videos.evaluateAll(elements => Math.ceil(Math.max(...elements.map(e => e.duration)) * 2000) + 8000);
        await videos.evaluateAll((elements, useNativeLoop) => {
            window.sisterLoopProbe = elements.map(video => {
                video.loop = useNativeLoop;
                const probe = { wraps: 0, last: video.currentTime, advancedAfterWrap: false };
                video.addEventListener('timeupdate', () => {
                    const now = video.currentTime;
                    if (probe.last - now > .5) { probe.wraps++; probe.advancedAfterWrap = false; }
                    if (probe.wraps >= 2 && now > .35) probe.advancedAfterWrap = true;
                    probe.last = now;
                });
                return probe;
            });
        }, nativeLoop);
        try {
            await expect.poll(() => page.evaluate(() => window.sisterLoopProbe.every(p => p.wraps >= 2 && p.advancedAfterWrap)),
                { timeout: loopTimeout, intervals: [200] }).toBe(true);
        } catch (error) {
            console.log('PR loop state', await videos.evaluateAll(elements => elements.map((e, i) => ({
                probe: window.sisterLoopProbe[i], time: e.currentTime, paused: e.paused, ended: e.ended,
                ready: e.readyState, seeking: e.seeking, hiddenDocument: document.hidden,
                seekable: Array.from({ length: e.seekable.length }, (_, n) => [e.seekable.start(n), e.seekable.end(n)])
            }))));
            throw error;
        }
        expect(await videos.evaluateAll(elements => elements.every(e => !e.paused && !e.ended))).toBe(true);
        await panel(page).locator('.sister-apps-motion-toggle').first().click();
        await videos.first().evaluate(e => e.dispatchEvent(new Event('ended')));
        expect(await videos.first().evaluate(e => e.paused)).toBe(true);
        await page.getByRole('button', { name: '紹介を閉じる' }).click();
        await closed(page);
        await videos.evaluateAll(elements => elements.forEach(e => e.dispatchEvent(new Event('ended'))));
        expect(await videos.evaluateAll(elements => elements.every(e => e.paused))).toBe(true);
    });
}
