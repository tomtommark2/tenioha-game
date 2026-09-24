const { test, expect } = require('@playwright/test');

const STORAGE_KEY = 'vocabGame_cardStatusVisible';

test.beforeEach(async ({ page, baseURL }) => {
    const origin = new URL(baseURL).origin;
    await page.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
    await page.addInitScript(() => {
        localStorage.setItem('vocabGame_skipWelcome', 'true');
        localStorage.setItem('vocabGame_disableAutoUpdate', 'true');
        localStorage.setItem('vocabGame_installGuideDismissed', 'true');
    });
    await page.goto('/index.html');
    await page.waitForFunction(() => typeof startLearningSession === 'function');
});

async function seedReview(page) {
    await page.evaluate(() => {
        startLearningSession();
        const word = gameState.currentWord;
        const key = getWordKeySafe(word, word.__sourceLevel || gameState.currentLevel);
        gameState.wordStates[key] = 'learned';
        gameState.srsData[key] = { recentAnswers: [true, false, true], successCount: 2, failCount: 1, dueAt: 123, reviewStep: 1 };
        gameState.isReviewWord = true;
        gameState.currentQuestionReason = 'due-learned';
        updateQuestionReasonUI();
    });
}

async function openSettings(page) {
    await page.getByRole('button', { name: 'その他メニュー', exact: true }).click();
    await page.getByRole('button', { name: '出題・復習設定', exact: true }).click();
    await expect(page.locator('#studyModeModal')).toBeVisible();
}

test('カード学習状況：320pxで最下部から切替でき、学習記録は変えない', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await seedReview(page);
    await expect(page.locator('.card-accuracy')).toHaveText('67%');
    await expect(page.locator('#questionReasonLabel')).toHaveText('得意の定着チェック');
    await openSettings(page);
    const toggle = page.getByRole('switch', { name: 'カードの学習状況を表示', exact: true });
    await expect(toggle).toBeChecked();
    const before = await page.evaluate(() => ({
        states: JSON.stringify(gameState.wordStates), srs: JSON.stringify(gameState.srsData),
        word: JSON.stringify(gameState.currentWord), score: JSON.stringify(gameState.reviewScore),
        undo: JSON.stringify(gameStateHistory), save: localStorage.getItem('vocabClickerSave'),
        dirty: window.isDirty, queue: buildReviewQueueSnapshot().dueWords.map(w => w.word)
    }));
    await toggle.uncheck();
    await expect(page.locator('.card-accuracy')).toHaveCount(0);
    await expect(page.locator('#questionReasonLabel')).toBeHidden();
    await expect(page.locator('#cardStatusSettingsStatus')).toHaveText('このブラウザに保存しました。');
    expect(await page.evaluate(() => ({
        states: JSON.stringify(gameState.wordStates), srs: JSON.stringify(gameState.srsData),
        word: JSON.stringify(gameState.currentWord), score: JSON.stringify(gameState.reviewScore),
        undo: JSON.stringify(gameStateHistory), save: localStorage.getItem('vocabClickerSave'),
        dirty: window.isDirty, queue: buildReviewQueueSnapshot().dueWords.map(w => w.word)
    }))).toEqual(before);
    const layout = await page.locator('.card-status-settings').evaluate(el => {
        const rect = el.getBoundingClientRect();
        return { left: rect.left, right: rect.right, width: innerWidth, fits: el.scrollWidth <= el.clientWidth };
    });
    expect(layout.left).toBeGreaterThanOrEqual(0);
    expect(layout.right).toBeLessThanOrEqual(layout.width);
    expect(layout.fits).toBe(true);
    await page.screenshot({ path: `screenshots/card-status-settings-${testInfo.project.name}.png` });
    await toggle.focus();
    await page.keyboard.press('Space');
    await expect(toggle).toBeChecked();
    await expect(page.locator('.card-accuracy')).toHaveText('67%');
    await expect(page.locator('#questionReasonLabel')).toHaveText('得意の定着チェック');
    await page.getByRole('button', { name: '出題・復習設定を閉じる', exact: true }).click();
    await expect(page.locator('#studyModeModal')).toBeHidden();
    await expect(page.locator('#learnedBtn')).toBeVisible();
});

test('カード学習状況：再読込・次のカード・カード再生成でも非表示を維持', async ({ page }) => {
    await seedReview(page);
    await openSettings(page);
    await page.getByRole('switch', { name: 'カードの学習状況を表示', exact: true }).uncheck();
    expect(await page.evaluate(key => localStorage.getItem(key), STORAGE_KEY)).toBe('false');
    await page.reload();
    await seedReview(page);
    await expect(page.locator('.card-accuracy')).toHaveCount(0);
    await expect(page.locator('#questionReasonLabel')).toBeHidden();
    await page.evaluate(() => {
        showNextWord();
        showNoWordsMessage();
        hideNoWordsMessage();
        showWord(gameState.currentWord);
        updateCardAccuracyUI();
    });
    await expect(page.locator('.card-accuracy')).toHaveCount(0);
    await expect(page.locator('#questionReasonLabel')).toBeHidden();
    await openSettings(page);
    await expect(page.getByRole('switch', { name: 'カードの学習状況を表示', exact: true })).not.toBeChecked();
});

test('カード学習状況：非表示中も回答を記録し、Undoは表示設定を戻さない', async ({ page }) => {
    await seedReview(page);
    const result = await page.evaluate(() => {
        const word = gameState.currentWord;
        const key = getWordKeySafe(word, word.__sourceLevel || gameState.currentLevel);
        const before = JSON.stringify(gameState.srsData[key]);
        saveState();
        setCardStatusVisible(false);
        updateSrsForWord(key, true, 'learned');
        gameState.wordStates[key] = deriveStateFromAccuracy(key);
        const recorded = [...gameState.srsData[key].recentAnswers];
        undoLastAction();
        return { recorded, restored: JSON.stringify(gameState.srsData[key]) === before, visible: cardStatusVisible };
    });
    expect(result).toEqual({ recorded: [true, false, true, true], restored: true, visible: false });
    await expect(page.locator('.card-accuracy')).toHaveCount(0);
    await expect(page.locator('#questionReasonLabel')).toBeHidden();
    await page.evaluate(() => setCardStatusVisible(true));
    await expect(page.locator('.card-accuracy')).toHaveText('67%');
});

test('カード学習状況：全出題理由に適用し、履歴なしではオンでも％を出さない', async ({ page }) => {
    await seedReview(page);
    for (const reason of ['due-weak', 'due-learned', 'manual-weak', 'manual-learned', 'manual-perfect']) {
        await page.evaluate(reason => { gameState.currentQuestionReason = reason; setCardStatusVisible(false); }, reason);
        await expect(page.locator('#questionReasonLabel')).toBeHidden();
        await page.evaluate(() => setCardStatusVisible(true));
        await expect(page.locator('#questionReasonLabel')).toBeVisible();
    }
    await page.evaluate(() => {
        const word = gameState.currentWord;
        gameState.srsData[getWordKeySafe(word, word.__sourceLevel || gameState.currentLevel)] = {};
        updateQuestionReasonUI();
    });
    await expect(page.locator('.card-accuracy')).toHaveCount(0);
});

test('カード学習状況：保存できない場合は元の表示とスイッチに戻す', async ({ page }) => {
    await seedReview(page);
    await openSettings(page);
    await page.evaluate(() => {
        const original = Storage.prototype.setItem;
        Storage.prototype.setItem = function (key, value) {
            if (key === 'vocabGame_cardStatusVisible') throw new Error('test quota');
            return original.call(this, key, value);
        };
    });
    // The app deliberately restores checked=true when this change cannot be saved.
    await page.locator('#cardStatusVisible').click();
    await expect(page.locator('#cardStatusVisible')).toBeChecked();
    await expect(page.locator('#cardStatusSettingsStatus')).toContainText('保存できなかったため');
    await expect(page.locator('.card-accuracy')).toHaveText('67%');
    await expect(page.locator('#questionReasonLabel')).toHaveText('得意の定着チェック');
});
