const { test, expect } = require('@playwright/test');
const pageErrors = new WeakMap();

test.beforeEach(async ({ page, baseURL }) => {
    pageErrors.set(page, []);
    page.on('pageerror', error => pageErrors.get(page).push(error.message));
    const origin = new URL(baseURL).origin;
    await page.route('**/*', route => new URL(route.request().url()).origin === origin
        ? route.continue() : route.abort());
    await page.addInitScript(() => {
        localStorage.setItem('vocabGame_skipWelcome', 'true');
        localStorage.setItem('vocabGame_skipLiveTutorial', 'true');
        localStorage.setItem('vocabGame_disableAutoUpdate', 'true');
        localStorage.setItem('vocabGame_installGuideDismissed', 'true');
        localStorage.setItem('vocabGame_lastAutoShownAnnouncementId', '2026-10-04-noun-illustrations-complete');
        localStorage.setItem('vocabGame_speechSettings', JSON.stringify({ autoRead: false, volume: 0 }));
    });
    await page.clock.install();
    await page.goto('/index.html');
    await expect(page.locator('#vocabWord')).toHaveText('クリックしてスタート');
    await page.evaluate(async () => {
        await document.fonts.ready;
        await Promise.all(['bar-chart', 'schedule', 'settings', 'close', 'edit-note', 'auto-awesome'].map(async name => {
            const image = new Image();
            image.src = `/assets/ui/${name}-rounded.svg`;
            await image.decode();
        }));
    });
});

test.afterEach(async ({ page }) => expect(pageErrors.get(page)).toEqual([]));

test('今日の学習：10秒無操作と吹き出し・非表示で止まり、無料残量と独立する', async ({ page }) => {
    await page.clock.fastForward(15000);
    expect(await page.locator('#dailyStudyTimerValue').textContent()).toBe('00:00');
    await page.locator('#vocabCard').click();
    await page.clock.fastForward(6000);
    await page.locator('#dailyStudyButton').click();
    expect(await page.locator('#dailyStudyElapsed').textContent()).toBe('00:06');
    await page.clock.fastForward(15000);
    expect(await page.locator('#dailyStudyElapsed').textContent()).toBe('00:06');
    await page.locator('#dailyStudyClose').click();
    await page.evaluate(() => { document.body.classList.remove('dismissible-modal-open'); DailyStudy.touch(); });
    await page.clock.fastForward(20000);
    await page.evaluate(() => DailyStudy.pause());
    expect(await page.locator('#dailyStudyTimerValue').textContent()).toBe('00:16');
    expect(await page.evaluate(() => trialState.playTimeSeconds)).toBeGreaterThan(16);
    await page.evaluate(() => DailyStudy.touch());
    await page.clock.fastForward(2000);
    await page.evaluate(() => {
        Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
        document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.clock.fastForward(20000);
    await expect(page.locator('#dailyStudyTimerValue')).toHaveText('00:18');
    await page.evaluate(() => {
        delete document.hidden;
        localStorage.setItem('vocabGame_isUnlocked', 'true');
        localStorage.setItem('vocabGame_expiry', String(Date.now() + 86400000));
        updateTrialTimer();
        DailyStudy.touch();
    });
    await page.clock.fastForward(3000);
    await page.evaluate(() => DailyStudy.pause());
    await expect(page.locator('#trialTimerDisplay')).toBeHidden();
    await expect(page.locator('#dailyStudyTimerValue')).toHaveText('00:21');
});

test('今日の学習：回答と苦手克服を集計し、Undo・設定変更・再読込で整合する', async ({ page }) => {
    await page.locator('#vocabCard').click();
    await page.locator('#vocabCard').click();
    await expect(page.locator('#dailyStudyPerfect')).toHaveText('1');
    await page.locator('#undoBtn').click();
    await expect(page.locator('#dailyStudyAnswered')).toHaveText('0');
    await expect(page.locator('#dailyStudyPerfect')).toHaveText('0');
    await page.evaluate(() => {
        const word = gameState.currentWord;
        const key = getWordKeySafe(word, word.__sourceLevel || gameState.currentLevel);
        gameState.wordStates[key] = 'weak';
        const entry = ensureSrsEntry(key);
        entry.recentAnswers = [false];
        entry.firstTryPerfect = false;
        delete entry.legacyReviewState;
        invalidateLearningProgressSnapshot();
        for (let i = 0; i < 4; i++) {
            gameState.currentWord = word;
            gameState.meaningCardFlipped = false;
            showWord(word);
            handleVocabCardClick();
        }
    });
    await expect(page.locator('#dailyStudyAnswered')).toHaveText('4');
    await expect(page.locator('#dailyStudyPerfect')).toHaveText('1');
    await expect(page.locator('#dailyStudyRecovered')).toHaveText('1');
    await page.locator('#undoBtn').click();
    await expect(page.locator('#dailyStudyAnswered')).toHaveText('3');
    await expect(page.locator('#dailyStudyPerfect')).toHaveText('0');
    await expect(page.locator('#dailyStudyRecovered')).toHaveText('0');
    await page.evaluate(() => selectMasteryThreshold(100));
    await expect(page.locator('#dailyStudyAnswered')).toHaveText('3');
    await page.reload();
    await expect(page.locator('#dailyStudyAnswered')).toHaveText('3');
    await page.locator('#vocabCard').click();
    await page.locator('#meaningCard').click();
    await expect(page.locator('#dailyStudyAnswered')).toHaveText('4');
    await page.locator('#meaningCard').click();
    await expect(page.locator('#dailyStudyAnswered')).toHaveText('4');
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('vocabClickerSave')).dailyStudy)).toBeUndefined();
});

test('今日の学習：320〜1280pxで入口と2種類の時間が重ならず、吹き出しでカードを動かさない', async ({ page }, testInfo) => {
    const overlaps = (a, b) => a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1;
    for (const width of [320, 360, 375, 390, 768, 1280]) {
        await page.setViewportSize({ width, height: 844 });
        const layout = await page.evaluate(() => {
            const rect = id => document.getElementById(id).getBoundingClientRect().toJSON();
            return { button: rect('dailyStudyButton'), timer: rect('dailyStudyTimerDisplay'),
                others: ['levelCurrentBtn', 'speechSettingsBtn', 'announcementBtn', 'sisterAppsBtn', 'topActionMenuBtn',
                    'modeButtonsShell', 'trialTimerDisplay'].map(rect),
                scores: [...document.querySelectorAll('.review-score-summary-row')].map(row => row.getBoundingClientRect().toJSON()), card: rect('vocabCard') };
        });
        for (const other of [...layout.others, layout.timer]) expect(overlaps(layout.button, other), `button ${width}`).toBe(false);
        for (const other of layout.others) expect(overlaps(layout.timer, other), `timer ${width}`).toBe(false);
        for (const score of layout.scores) expect(overlaps(layout.timer, score), `timer / score ${width}: ${JSON.stringify({ timer: layout.timer, score })}`).toBe(false);
        await page.locator('#dailyStudyButton').click();
        const popup = await page.locator('.daily-study-panel').boundingBox();
        expect(popup.x).toBeGreaterThanOrEqual(0);
        expect(popup.x + popup.width).toBeLessThanOrEqual(width);
        expect(popup.y + popup.height).toBeLessThanOrEqual(844);
        expect((await page.locator('#vocabCard').boundingBox()).y).toBe(layout.card.y);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        if ([320, 390, 1280].includes(width)) await page.screenshot({ path: `screenshots/daily-study-20261026-${width}-${testInfo.project.name}.png` });
        await page.locator('#dailyStudyClose').click();
        await expect(page.locator('#dailyStudyModal')).toBeHidden();
    }
    await page.setViewportSize({ width: 568, height: 320 });
    await page.locator('#dailyStudyButton').click();
    const landscape = await page.locator('.daily-study-panel').boundingBox();
    expect(landscape.y + landscape.height).toBeLessThanOrEqual(320);
    await page.locator('#dailyStudyShowTimer').uncheck();
    await page.locator('#dailyStudyClose').click();
    await expect(page.locator('#dailyStudyModal')).toBeHidden();
});

test('今日の学習：表示設定を保持し、閉じる・背景・Escape・戻るで入口へ復帰する', async ({ page }) => {
    await page.locator('#dailyStudyButton').click();
    await expect(page.locator('#dailyStudyClose')).toBeFocused();
    await page.locator('#dailyStudyShowTimer').uncheck();
    await page.locator('#dailyStudyClose').click();
    await expect(page.locator('#dailyStudyButton')).toBeFocused();
    await expect(page.locator('#dailyStudyTimerDisplay')).toBeHidden();
    await page.reload();
    await expect(page.locator('#dailyStudyTimerDisplay')).toBeHidden();
    await page.locator('#dailyStudyButton').click();
    await page.keyboard.press('Escape');
    await expect(page.locator('#dailyStudyModal')).toBeHidden();
    await expect(page.locator('#dailyStudyButton')).toBeFocused();
    await page.locator('#dailyStudyButton').click();
    await page.locator('#dailyStudyModal').click({ position: { x: 2, y: 2 } });
    await expect(page.locator('#dailyStudyModal')).toBeHidden();
    await page.locator('#dailyStudyButton').click();
    await expect.poll(() => page.evaluate(() => !!history.state?.__teniohaModalLayer)).toBe(true);
    await page.goBack();
    await expect(page.locator('#dailyStudyModal')).toBeHidden();
    await expect(page.locator('#dailyStudyButton')).toBeFocused();
});

test('今日の学習：無料の時間制限を維持し、同期HTMLとオフライン素材をそろえる', async ({ page }) => {
    await page.evaluate(() => {
        isTrialLimitDisabledForLocalDevelopment = () => false;
        trialState.playTimeSeconds = 480;
        ensureTrialAccess();
    });
    await expect(page.locator('#trialOverlay')).toBeVisible();
    expect(await page.evaluate(() => ensureTrialAccess())).toBe(false);
    expect(await page.locator('#dailyStudyTimerValue').textContent()).toBe('00:00');
    await page.goto('/vocab_clicker_game.html');
    await expect(page.locator('#dailyStudyButton')).toBeVisible();
    const worker = await (await page.request.get('/service_worker.js')).text();
    for (const path of ['daily-study.css', 'js/daily_study.js', 'assets/ui/bar-chart-rounded.svg', 'assets/ui/schedule-rounded.svg', 'assets/ui/settings-rounded.svg']) {
        expect(worker).toContain(`'./${path}'`);
        expect((await page.request.get('/' + path)).ok()).toBe(true);
    }
});
