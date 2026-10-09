const { test, expect } = require('@playwright/test');
const fs = require('fs');
const errors = new WeakMap();

test.beforeEach(async ({ page, baseURL }) => {
    errors.set(page, []);
    page.on('pageerror', error => errors.get(page).push(error.message));
    const origin = new URL(baseURL).origin;
    await page.route('**/*', route => {
        const url = new URL(route.request().url());
        return url.origin === origin || ['fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname)
            ? route.continue() : route.abort();
    });
    await page.addInitScript(() => {
        localStorage.setItem('vocabGame_skipWelcome', 'true');
        localStorage.setItem('vocabGame_disableAutoUpdate', 'true');
        localStorage.setItem('vocabGame_installGuideDismissed', 'true');
        localStorage.setItem('vocabGame_lastAutoShownAnnouncementId', '2026-10-04-noun-illustrations-complete');
        localStorage.setItem('vocabGame_speechSettings', JSON.stringify({ autoRead: false, volume: 0 }));
    });
    await page.goto('/index.html');
    await page.waitForFunction(() => typeof updateModeButtons === 'function' && !!window.WordIllustrations);
    await page.evaluate(() => document.fonts.ready);
});

test.afterEach(async ({ page }) => { expect(errors.get(page)).toEqual([]); });

async function inspectLayout(page) {
    return page.evaluate(() => {
        const rect = element => {
            const { left, right, top, bottom, width, height } = element.getBoundingClientRect();
            return { left, right, top, bottom, width, height };
        };
        const textRect = element => {
            const range = document.createRange();
            range.selectNodeContents(element);
            return rect(range);
        };
        return {
            pageFits: document.documentElement.scrollWidth <= innerWidth,
            boundary: document.querySelector('.app-shell').getBoundingClientRect().top
                + parseFloat(getComputedStyle(document.querySelector('.app-shell'), '::after').top),
            hero: rect(document.getElementById('heroCharacter')),
            characterArea: rect(document.querySelector('.learning-header .rpg-inline')),
            illustration: rect(document.getElementById('wordIllustrationSlot')),
            panel: rect(document.querySelector('.learning-header .mode-buttons')),
            score: rect(document.querySelector('.learning-header .review-score-summary')),
            scoreRows: [...document.querySelectorAll('.learning-header .review-score-summary-row')].map(element => ({
                bounds: rect(element), texts: [...element.querySelectorAll('span:not(.review-rank-caret), strong')]
                    .map(text => text.tagName === 'STRONG' ? rect(text) : textRect(text))
            })),
            level: rect(document.getElementById('levelCurrentBtn')),
            card: rect(document.getElementById('vocabCard')),
            buttons: [...document.querySelectorAll('.learning-header .mode-btn')].map(button => ({
                bounds: rect(button),
                label: textRect(button.children[1]),
                count: textRect(button.querySelector('.mode-count')),
                icon: rect(button.querySelector('.mode-picto')),
                background: getComputedStyle(button).backgroundColor,
                shadow: getComputedStyle(button).boxShadow,
                mask: getComputedStyle(button.querySelector('.mode-picto'), '::before').maskImage
            }))
        };
    });
}

function assertLayout(layout, width, illustrated = false) {
    expect(layout.pageFits, `${width}px page`).toBe(true);
    expect(layout.panel.left, `${width}px right of character`).toBeGreaterThanOrEqual(
        (illustrated ? layout.illustration.right : layout.hero.right) - 1);
    if (width <= 768) {
        expect(layout.score.bottom, `${width}px score above panel`).toBeLessThanOrEqual(layout.panel.top + 1);
    } else {
        expect(layout.score.left, `${width}px legacy score beside character`).toBeCloseTo(layout.characterArea.left + 94, 1);
        expect(layout.score.top, `${width}px legacy score height`).toBeCloseTo(layout.characterArea.top - 32, 1);
        expect(layout.score.left).toBeGreaterThanOrEqual((illustrated ? layout.illustration.right : layout.hero.right) - 1);
        expect(layout.score.right).toBeLessThanOrEqual(layout.panel.left);
        expect(layout.score.bottom).toBeLessThanOrEqual(layout.card.top);
        expect(layout.score.width).toBe(112);
        for (const row of layout.scoreRows) {
            expect(row.bounds.left, `${width}px score row starts at legacy position`).toBeCloseTo(layout.score.left, 1);
            expect(row.bounds.width, `${width}px score row fills legacy width`).toBeCloseTo(layout.score.width, 1);
        }
        for (let index = 1; index < layout.scoreRows.length; index++) {
            expect(layout.scoreRows[index].bounds.top).toBeGreaterThanOrEqual(layout.scoreRows[index - 1].bounds.bottom + 4);
        }
    }
    expect(layout.panel.bottom, `${width}px before word card`).toBeLessThanOrEqual(layout.card.top + 1);
    for (const row of layout.scoreRows) {
        const scoreArea = width <= 768 ? layout.panel : layout.score;
        expect(row.bounds.left).toBeGreaterThanOrEqual(scoreArea.left - 1);
        expect(row.bounds.right).toBeLessThanOrEqual(scoreArea.right + 1);
        for (const text of row.texts) {
            expect(text.left).toBeGreaterThanOrEqual(row.bounds.left - 1);
            expect(text.right).toBeLessThanOrEqual(row.bounds.right + 1);
        }
        expect(row.bounds.left < layout.level.right && row.bounds.right > layout.level.left
            && row.bounds.top < layout.level.bottom && row.bounds.bottom > layout.level.top,
        `${width}px score ${JSON.stringify(row.bounds)} / level ${JSON.stringify(layout.level)}`).toBe(false);
    }
    if (width <= 768) {
        expect(layout.boundary - layout.panel.bottom, `${width}px purple gap below panel`).toBeCloseTo(2, 1);
        if (illustrated) expect(layout.illustration.bottom).toBeLessThanOrEqual(layout.boundary + .5);
    }
    const first = layout.buttons[0].bounds;
    for (const button of layout.buttons) {
        expect(button.bounds.top).toBe(first.top);
        expect(button.bounds.width).toBeCloseTo(first.width, 1);
        expect(button.bounds.width).toBeGreaterThanOrEqual(44);
        expect(button.bounds.height).toBeGreaterThanOrEqual(44);
        expect(button.background).toBe('rgba(0, 0, 0, 0)');
        expect(button.shadow).toBe('none');
        for (const text of [button.label, button.count, button.icon]) {
            expect(text.left, `${width}px text left`).toBeGreaterThanOrEqual(button.bounds.left - 1);
            expect(text.right, `${width}px text right`).toBeLessThanOrEqual(button.bounds.right + 1);
            expect(text.top, `${width}px text top`).toBeGreaterThanOrEqual(button.bounds.top - 1);
            expect(text.bottom, `${width}px text bottom`).toBeLessThanOrEqual(button.bounds.bottom + 1);
        }
    }
}

test('学習分類：320〜1280pxでキャラ右側に一列で収め、4桁の件数を切らない', async ({ page }, testInfo) => {
    await page.evaluate(() => {
        document.querySelectorAll('.mode-count').forEach(element => { element.textContent = '9999'; });
        document.getElementById('reviewScoreHeaderToday').textContent = '9999pt';
        document.getElementById('reviewScoreHeaderWeek').textContent = '9999pt';
        document.getElementById('reviewRankHeader').textContent = '9999位';
    });
    for (const width of [320, 360, 375, 380, 390, 568, 768, 769, 1280]) {
        await page.setViewportSize({ width, height: 844 });
        assertLayout(await inspectLayout(page), width);
    }
    await page.setViewportSize({ width: 320, height: 844 });
    await page.evaluate(() => { document.getElementById('levelCurrentLabel').textContent = 'ターゲット1900'; });
    assertLayout(await inspectLayout(page), 320);
    await page.evaluate(() => { document.getElementById('levelCurrentLabel').textContent = '基礎'; });
    const masks = (await inspectLayout(page)).buttons.map(button => button.mask);
    const worker = fs.readFileSync('service_worker.js', 'utf8');
    expect(worker).toContain("'./header-m3e.css'");
    for (const [index, name] of ['menu-book-outline-rounded', 'refresh-rounded', 'check-circle-rounded', 'auto-awesome-rounded'].entries()) {
        expect(masks[index]).toContain(`${name}.svg`);
        expect(worker).toContain(`'./assets/ui/${name}.svg'`);
        const response = await page.request.get(`/assets/ui/${name}.svg`);
        expect(response.ok()).toBe(true);
        expect(await response.text()).toContain('<svg');
    }
    await page.evaluate(() => {
        ['1231', '128', '456', '72'].forEach((value, index) => {
            document.querySelectorAll('.mode-count')[index].textContent = value;
        });
        document.getElementById('reviewScoreHeaderToday').textContent = '0pt';
        document.getElementById('reviewScoreHeaderWeek').textContent = '0pt';
        document.getElementById('reviewRankHeader').textContent = '--位';
    });
    fs.mkdirSync('screenshots/header-m3e-20261010', { recursive: true });
    for (const width of [320, 390, 1280]) {
        await page.setViewportSize({ width, height: 844 });
        assertLayout(await inspectLayout(page), width);
        await page.screenshot({ path: `screenshots/header-m3e-20261010/sample-${width}-${testInfo.project.name}.png` });
        if (width === 320) await page.screenshot({
            path: `screenshots/header-m3e-20261010/header-320-${testInfo.project.name}.png`,
            clip: { x: 0, y: 0, width: 320, height: 200 }, scale: 'css'
        });
    }
});

test('学習分類：クリック・Enter・Spaceで選択し、学習記録とランキング入口を維持する', async ({ page }) => {
    const records = () => page.evaluate(() => JSON.stringify({ states: gameState.wordStates,
        srs: gameState.srsData, score: gameState.reviewScore, counts: gameState.actionCounts }));
    const before = await records();
    for (const [mode, key] of [['weak', 'Enter'], ['learned', 'Space'], ['perfect', null], ['unlearned', null]]) {
        const button = page.locator(`.learning-header .mode-btn[data-mode="${mode}"]`);
        if (key) await button.press(key);
        else await button.click();
        await expect(button).toHaveAttribute('aria-pressed', 'true');
        await expect(page.locator('.learning-header .mode-btn.active')).toHaveCount(1);
        if (key) {
            await expect(button).toBeFocused();
            expect(await button.evaluate(element => getComputedStyle(element).outlineStyle)).toBe('solid');
        }
    }
    expect(await records()).toBe(before);
    // Touch WebKit does not focus buttons on click; use the keyboard for the focus-return contract.
    await page.getByRole('button', { name: '復習ランキングを開く', exact: true }).press('Enter');
    await expect(page.locator('#leaderboardModal')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#leaderboardModal')).toBeHidden();
    await expect(page.locator('#reviewRankButton')).toBeFocused();
});

test('学習分類：復習ロックとイラスト常時表示でも分類の配置と操作を保つ', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 320, height: 844 });
    await page.evaluate(() => { gameState.reviewMode = 'on'; updateModeButtons(); });
    await expect(page.locator('#modeSelectionLock')).toBeVisible();
    await expect(page.locator('#modeSelectionLock')).toHaveText('復習中は変更できません');
    for (const button of await page.locator('.learning-header .mode-btn').all()) await expect(button).toBeDisabled();
    const lockFits = await page.locator('#modeSelectionLock').evaluate(element => {
        const lock = element.getBoundingClientRect(), panel = element.parentElement.getBoundingClientRect();
        return lock.left >= panel.left && lock.right <= panel.right && lock.top >= panel.top && lock.bottom <= panel.bottom;
    });
    expect(lockFits).toBe(true);
    await page.evaluate(() => {
        gameState.reviewMode = 'off';
        updateModeButtons();
        WordIllustrations.setAlwaysVisible(true);
        const word = vocabularyDatabase.junior.find(item => item.word === 'apple');
        openWordFromList('junior', encodeURIComponent(getWordKeySafe(word, 'junior')));
    });
    await expect(page.locator('#modeSelectionLock')).toBeHidden();
    await expect(page.locator('#wordIllustrationSlot')).toBeVisible();
    await expect(page.locator('#wordIllustration')).toHaveAttribute('src', /apple/);
    await page.locator('#wordIllustration').evaluate(image => image.decode());
    for (const width of [320, 390, 768, 1280]) {
        await page.setViewportSize({ width, height: 844 });
        assertLayout(await inspectLayout(page), width, true);
    }
    await page.setViewportSize({ width: 320, height: 844 });
    await page.screenshot({ path: `screenshots/header-m3e-20261010/illustrated-320-${testInfo.project.name}.png` });
});

test('学習分類：紫と白の境目に足元を揃え、スコアを右側へまとめる', async ({ page }, testInfo) => {
    const feet = await page.evaluate(async () => {
        const hero = document.getElementById('heroCharacter');
        const sprite = new Image();
        sprite.src = getComputedStyle(hero).backgroundImage.match(/url\(["']?([^"')]+)/)[1];
        await sprite.decode();
        const canvas = document.createElement('canvas');
        canvas.width = 300;
        canvas.height = 256;
        const context = canvas.getContext('2d');
        context.imageSmoothingEnabled = false;
        context.drawImage(sprite, 0, 0, 300, 256);
        const pixels = context.getImageData(0, 0, 300, 256).data;
        return [0, 1, 2].map(row => {
            let bottom = 0;
            for (let column = 0; column < 6; column++) {
                for (let y = 0; y < 64; y++) {
                    for (let x = 0; x < 50; x++) {
                        if (pixels[((row * 64 + y) * 300 + column * 50 + x) * 4 + 3] > 128) bottom = Math.max(bottom, y + 1);
                    }
                }
            }
            return bottom;
        });
    });
    for (const width of [320, 390, 532, 768]) {
        await page.setViewportSize({ width, height: 844 });
        for (const [index, state] of ['idle', 'attack', 'cheer'].entries()) {
            const layout = await page.evaluate(({ state, foot }) => {
                const hero = document.getElementById('heroCharacter');
                hero.className = `pixel-art anim-${state}`;
                hero.style.animation = 'none';
                const bounds = hero.getBoundingClientRect();
                const boundary = document.querySelector('.app-shell').getBoundingClientRect().top
                    + parseFloat(getComputedStyle(document.querySelector('.app-shell'), '::after').top);
                const panel = document.querySelector('.learning-header .mode-buttons').getBoundingClientRect();
                const rows = [...document.querySelectorAll('.learning-header .review-score-summary-row')].map(element => {
                    const { left, right, top, bottom } = element.getBoundingClientRect();
                    return { left, right, top, bottom };
                });
                const level = document.getElementById('levelCurrentBtn').getBoundingClientRect();
                return { feet: bounds.top + foot * bounds.height / 64, boundary, panelBottom: panel.bottom,
                    panelLeft: panel.left, panelRight: panel.right, rows,
                    overlapsLevel: rows.some(row => row.left < level.right && row.right > level.left && row.top < level.bottom && row.bottom > level.top) };
            }, { state, foot: feet[index] });
            expect(layout.feet, `${width}px ${state} feet`).toBeLessThanOrEqual(layout.boundary + .5);
            expect(layout.feet).toBeGreaterThanOrEqual(layout.boundary - 3);
            expect(layout.boundary - layout.panelBottom).toBeCloseTo(2, 1);
            expect(layout.rows[0].left).toBeGreaterThan(layout.panelLeft + 20);
            expect(layout.rows[2].right).toBeCloseTo(layout.panelRight, 0);
            expect(layout.overlapsLevel).toBe(false);
        }
    }
    await page.evaluate(() => { document.getElementById('heroCharacter').className = 'pixel-art anim-idle'; });
    await page.setViewportSize({ width: 532, height: 844 });
    await page.screenshot({ path: `screenshots/header-m3e-20261010/boundary-532-${testInfo.project.name}.png`, scale: 'css' });
});

test('学習分類：復習球と101語の案内を出しても境目・分類・カードがずれない', async ({ page }, testInfo) => {
    await page.evaluate(() => {
        gameState.currentLevel = 'basic';
        gameState.currentMode = 'unlearned';
        gameState.reviewMode = 'off';
        gameState.wordStates = {};
        gameState.srsData = {};
        gameState.decks = null;
        gameState.activeReviewLevels = ['basic'];
        gameState.posFilters = ['名', '動', '形', '副', '助', '前', '接', '代', 'other'];
        const words = [...new Map(vocabularyDatabase.basic.map(word => [getWordKeySafe(word, 'basic'), word])).values()].slice(0, 101);
        for (const word of words) {
            const key = getWordKeySafe(word, 'basic');
            gameState.wordStates[key] = 'weak';
            gameState.srsData[key] = { dueAt: Date.now() - 1000, reviewStep: 1, scheduledIntervalDays: 1,
                recentAnswers: [false], successCount: 0, failCount: 1, everWrong: true };
        }
        loadVocabularyForLevel();
        invalidateLearningProgressSnapshot();
        activateLearningSessionUI();
        setReviewRecommendationEnabled(false);
        showNextWord(updateDisplay());
    });
    const positions = () => page.evaluate(() => ['.learning-header .mode-buttons', '#heroCharacter',
        '#reviewProgressWrap', '#reviewQueuePreview', '#cardsArea'].map(selector => {
        const { top, bottom, height } = document.querySelector(selector).getBoundingClientRect();
        return { selector, top, bottom, height };
    }));
    for (const width of [320, 390, 532, 768, 1280]) {
        await page.setViewportSize({ width, height: 844 });
        // New question text can load another font subset; let its ResizeObserver finish before measuring.
        await page.evaluate(async () => {
            await document.fonts.ready;
            await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        });
        const before = await positions();
        await page.evaluate(() => setReviewRecommendationEnabled(true));
        await expect(page.locator('#reviewRecommendation')).toBeVisible();
        await expect(page.locator('#reviewProgressLabel')).toContainText('101');
        expect(await positions()).toEqual(before);
        assertLayout(await inspectLayout(page), width);
        await expect(page.locator('#reviewQueuePreview > *').first()).toBeVisible();
        for (const selector of ['.learning-header .mode-btn', '#reviewModeInlineLabel', '#reviewQueueShuffleButton', '#vocabCard', '#meaningCard']) {
            for (const control of await page.locator(selector).all()) {
                expect(await control.evaluate(element => {
                    const bounds = element.getBoundingClientRect();
                    return element.contains(document.elementFromPoint(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2));
                }), `${width}px ${selector} remains reachable`).toBe(true);
            }
        }
        await page.screenshot({ path: `screenshots/header-m3e-20261010/review-101-${width}-${testInfo.project.name}.png`, scale: 'css' });
        await page.evaluate(() => setReviewRecommendationEnabled(false));
        expect(await positions()).toEqual(before);
    }
    await page.locator('#reviewModeInlineLabel').click();
    await expect(page.locator('#reviewModeInlineLabel')).toHaveText('新規＋復習');
    await page.locator('#reviewModeInlineLabel').click();
    await expect(page.locator('#reviewModeInlineLabel')).toHaveText('復習だけ');
    await expect(page.locator('#modeSelectionLock')).toBeVisible();
    await expect(page.locator('#unlearnedBtn')).toBeDisabled();
    await expect(page.locator('#reviewQueuePreview > *').first()).toBeVisible();
    await page.setViewportSize({ width: 320, height: 844 });
    assertLayout(await inspectLayout(page), 320);
    await page.screenshot({ path: `screenshots/header-m3e-20261010/review-only-320-${testInfo.project.name}.png`, scale: 'css' });
});
