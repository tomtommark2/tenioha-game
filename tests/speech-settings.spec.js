const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page, baseURL }) => {
    await page.route(url => /^https?:$/.test(url.protocol) && url.origin !== new URL(baseURL).origin, route => route.abort());
    await page.addInitScript(() => {
        localStorage.setItem('vocabGame_skipWelcome', 'true');
        localStorage.setItem('vocabGame_disableAutoUpdate', 'true');
        localStorage.setItem('vocabGame_installGuideDismissed', 'true');
        window.speechCalls = [];
        window.cancelCalls = 0;
        Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: {
            getVoices: () => [{ name: 'Google US English', voiceURI: 'test-en', lang: 'en-US' }],
            speak: value => window.speechCalls.push({ text: value.text, volume: value.volume }),
            cancel: () => window.cancelCalls++
        } });
        window.SpeechSynthesisUtterance = function (text) { this.text = text; };
    });
    await page.goto('/index.html');
    await expect(page.locator('#speechSettingsBtn')).toBeVisible();
});

test('読み上げ設定：自動オフ・手動再生・音量0・保存・閉じる', async ({ page }) => {
    await page.locator('#speechSettingsBtn').click();
    await page.locator('#speechAutoRead').uncheck();
    await page.locator('#speechVolume').fill('35');
    await expect(page.locator('#speechVolumeValue')).toHaveText('35%');
    await page.locator('#speechPreviewBtn').click();
    await expect.poll(() => page.evaluate(() => speechCalls.length)).toBe(1);
    expect(await page.evaluate(() => speechCalls[0].volume)).toBe(0.35);
    await page.keyboard.press('Escape');
    await expect(page.locator('#speechSettingsModal')).toBeHidden();
    await expect(page.locator('#speechSettingsBtn')).toBeFocused();
    await page.locator('#vocabCard').click();
    await page.waitForTimeout(400);
    expect(await page.evaluate(() => speechCalls.length)).toBe(1);
    await page.locator('#speakerBtn').click();
    await expect.poll(() => page.evaluate(() => speechCalls.length)).toBe(2);
    await page.reload();
    await page.locator('#speechSettingsBtn').click();
    await expect(page.locator('#speechAutoRead')).not.toBeChecked();
    await expect(page.locator('#speechVolume')).toHaveValue('35');
    await page.locator('#speechVolume').fill('0');
    await expect(page.locator('#speechPreviewBtn')).toBeDisabled();
    await page.evaluate(() => speakText('Silent'));
    expect(await page.evaluate(() => speechCalls.length)).toBe(0);
    await page.locator('#speechAutoRead').check();
    await page.locator('#speechVolume').fill('60');
    await page.evaluate(() => speakEnglishText('Automatic', { automatic: true }));
    await expect.poll(() => page.evaluate(() => speechCalls.length)).toBe(1);
    expect(await page.evaluate(() => speechCalls[0].volume)).toBe(0.6);
});

test('読み上げ設定：待機中の音声もオフで中止', async ({ page }) => {
    const result = await page.evaluate(async () => {
        let resolveVoice;
        waitForPreferredEnglishVoice = () => new Promise(resolve => { resolveVoice = resolve; });
        speakEnglishText('Pending', { automatic: true });
        updateSpeechSettings({ autoRead: false });
        resolveVoice({ name: 'Google US English', lang: 'en-US' });
        await Promise.resolve();
        return speechCalls.length;
    });
    expect(result).toBe(0);
});

async function learningSnapshot(page) {
    return page.evaluate(() => JSON.stringify({
        word: gameState.currentWord,
        wordStates: gameState.wordStates,
        srsData: gameState.srsData,
        count: gameState.globalQuestionCount,
        score: gameState.reviewScore,
        actions: gameState.actionCounts,
        intervals: gameState.learnedWordIntervals,
        dailyStats: gameState.dailyStats,
        undo: gameStateHistory,
        flipped: gameState.meaningCardFlipped,
        saved: localStorage.getItem('vocabClickerSave')
    }));
}

test('読み上げ設定：単語ボタンはクリック・Enter・Spaceでも回答せず単語だけ再生', async ({ page }) => {
    await expect(page.locator('#wordSpeechBtn')).toBeHidden();
    await page.evaluate(() => updateSpeechSettings({ autoRead: false, volume: 0.35 }));
    await page.locator('#vocabCard').click();
    await expect(page.locator('#wordSpeechBtn')).toBeVisible();
    await page.waitForTimeout(250);
    const word = await page.evaluate(() => gameState.currentWord.word);
    const before = await learningSnapshot(page);
    await page.locator('#wordSpeechBtn').click();
    await page.locator('#wordSpeechBtn').focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Space');
    await expect.poll(() => page.evaluate(() => speechCalls.length)).toBe(3);
    expect(await page.evaluate(() => speechCalls)).toEqual(Array(3).fill({ text: word, volume: 0.35 }));
    expect(await learningSnapshot(page)).toBe(before);
    await expect(page.locator('#undoBtn')).toBeDisabled();

    await page.locator('#speakerBtn').click();
    await expect.poll(() => page.evaluate(() => speechCalls.length)).toBe(4);
    const example = await page.evaluate(() => gameState.currentWord.senses?.[currentExampleIndex]?.example || gameState.currentWord.example || gameState.currentWord.word);
    expect(await page.evaluate(() => speechCalls[3].text)).toBe(example);
    expect(await learningSnapshot(page)).toBe(before);

    // The card itself must still accept keyboard answers.
    await page.locator('#vocabCard').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#undoBtn')).toBeEnabled();
});

test('読み上げ設定：単語ボタンの非表示を保存し、自動読み上げと例文は独立', async ({ page }) => {
    await page.locator('#vocabCard').click();
    await expect(page.locator('#wordSpeechBtn')).toBeVisible();
    await page.locator('#speechSettingsBtn').click();
    await expect(page.locator('#speechShowWordButton')).toBeChecked();
    await page.locator('#speechShowWordButton').uncheck();
    await expect(page.locator('#wordSpeechBtn')).toBeHidden();
    await expect(page.locator('#speechAutoRead')).toBeChecked();
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('vocabGame_speechSettings')))).toMatchObject({ showWordButton: false, autoRead: true });
    await page.reload();
    await page.locator('#vocabCard').click();
    await expect(page.locator('#wordSpeechBtn')).toBeHidden();
    await expect.poll(() => page.evaluate(() => speechCalls.length)).toBe(1);
    await page.locator('#speakerBtn').click();
    await expect.poll(() => page.evaluate(() => speechCalls.length)).toBe(2);
    await page.locator('#speechSettingsBtn').click();
    await expect(page.locator('#speechShowWordButton')).not.toBeChecked();
    await page.locator('#speechAutoRead').uncheck();
    await page.locator('#speechShowWordButton').check();
    await page.getByRole('button', { name: '読み上げ設定を閉じる' }).click();
    await expect(page.locator('#speechSettingsBtn')).toBeFocused();
    await page.locator('#wordSpeechBtn').click();
    await expect.poll(() => page.evaluate(() => speechCalls.length)).toBe(3);
});

test('読み上げ設定：単語ボタンはUndo・カード再作成・開始前に対応', async ({ page }) => {
    await page.evaluate(() => updateSpeechSettings({ autoRead: false }));
    await page.locator('#vocabCard').click();
    const word = await page.evaluate(() => gameState.currentWord.word);
    await page.locator('#vocabCard').click();
    await page.locator('#undoBtn').click();
    await page.locator('#wordSpeechBtn').click();
    await expect.poll(() => page.evaluate(() => speechCalls[0]?.text)).toBe(word);
    await page.evaluate(() => {
        showNoWordsMessage();
        hideNoWordsMessage();
        showWord(gameState.currentWord);
        setupCardListeners();
        setupCardListeners();
    });
    const before = await learningSnapshot(page);
    await page.locator('#wordSpeechBtn').click();
    await expect.poll(() => page.evaluate(() => speechCalls.length)).toBe(2);
    expect(await learningSnapshot(page)).toBe(before);
    await page.evaluate(() => showLearningStartPrompt());
    await expect(page.locator('#wordSpeechBtn')).toBeHidden();
    await page.locator('#vocabCard').click();
    await expect(page.locator('#wordSpeechBtn')).toBeVisible();
});

test('読み上げ設定：単語の手動再生は予約された自動再生を取り消す', async ({ page }) => {
    const result = await page.evaluate(async () => {
        startLearningSession();
        const word = gameState.currentWord.word;
        document.getElementById('wordSpeechBtn').click();
        const timerCleared = wordSpeechTimer === null;
        await new Promise(resolve => setTimeout(resolve, 300));
        return { word, timerCleared, calls: speechCalls };
    });
    expect(result.timerCleared).toBe(true);
    expect(result.calls).toEqual([{ text: result.word, volume: 1 }]);
});

test('読み上げ設定：旧設定は表示オン、音量0・音声非対応では単語ボタンを無効化', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('vocabGame_speechSettings', JSON.stringify({ autoRead: false, volume: 0.6 })));
    await page.reload();
    await page.locator('#vocabCard').click();
    await expect(page.locator('#wordSpeechBtn')).toBeEnabled();
    await page.locator('#speechSettingsBtn').click();
    await expect(page.locator('#speechShowWordButton')).toBeChecked();
    await page.locator('#speechVolume').fill('0');
    await expect(page.locator('#wordSpeechBtn')).toBeDisabled();
    await page.locator('#speechVolume').fill('60');
    await expect(page.locator('#wordSpeechBtn')).toBeEnabled();
    await page.evaluate(() => {
        Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: undefined });
        renderWordSpeechButton();
        renderSpeechSettings();
    });
    await expect(page.locator('#wordSpeechBtn')).toBeDisabled();
    await expect(page.locator('#speechSettingsStatus')).toHaveText('このブラウザは読み上げに対応していません。');
});

for (const width of [320, 1280]) {
    test(`読み上げ設定：単語ボタンの配置とタップ ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.evaluate(() => updateSpeechSettings({ autoRead: false }));
        await page.locator('#vocabCard').click();
        await page.evaluate(() => showWord(Object.values(vocabularyDatabase).flat().find(word => word.word === 'businesswoman')));
        const button = page.locator('#wordSpeechBtn');
        await expect(button).toBeVisible();
        const boxes = await page.evaluate(() => {
            const rect = element => {
                const r = element.getBoundingClientRect();
                return { x: r.x, y: r.y, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
            };
            return { button: rect(document.getElementById('wordSpeechBtn')), card: rect(document.getElementById('vocabCard')),
                label: rect(document.querySelector('#vocabCard > .card-label')), word: rect(document.getElementById('vocabWord')) };
        });
        expect(boxes.button.width).toBeGreaterThanOrEqual(44);
        expect(boxes.button.height).toBeGreaterThanOrEqual(44);
        expect(boxes.button.x).toBeGreaterThanOrEqual(boxes.card.x);
        expect(boxes.button.right).toBeLessThanOrEqual(boxes.card.right);
        expect(boxes.button.y).toBeGreaterThanOrEqual(boxes.card.y);
        expect(boxes.word.x).toBeGreaterThanOrEqual(boxes.card.x);
        expect(boxes.word.right).toBeLessThanOrEqual(boxes.card.right);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
        for (const other of [boxes.label, boxes.word]) {
            expect(boxes.button.right <= other.x || other.right <= boxes.button.x || boxes.button.bottom <= other.y || other.bottom <= boxes.button.y, JSON.stringify({ button: boxes.button, other })).toBeTruthy();
        }
        const before = await learningSnapshot(page);
        if (test.info().project.name.startsWith('mobile')) await button.tap();
        else await button.click();
        await expect.poll(() => page.evaluate(() => speechCalls.length)).toBe(1);
        expect(await learningSnapshot(page)).toBe(before);
        await page.screenshot({ path: `tmp/word-speech-${width}-${test.info().project.name}.png` });
        await page.locator('#speechSettingsBtn').click();
        await page.screenshot({ path: `tmp/word-speech-settings-${width}-${test.info().project.name}.png` });
    });
}

test('読み上げ設定：横向き・背景クリック・戻る・フォーカス循環', async ({ page, baseURL }) => {
    await page.setViewportSize({ width: 568, height: 320 });
    await page.locator('#speechSettingsBtn').click();
    await expect(page.locator('#speechSettingsModal')).toBeVisible();
    await page.getByRole('button', { name: '読み上げ設定を閉じる' }).focus();
    await page.keyboard.press('Shift+Tab');
    await expect(page.locator('#speechPreviewBtn')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: '読み上げ設定を閉じる' })).toBeFocused();
    await page.locator('#speechSettingsModal').click({ position: { x: 2, y: 2 } });
    await expect(page.locator('#speechSettingsModal')).toBeHidden();
    await expect(page.locator('#speechSettingsBtn')).toBeFocused();
    await page.locator('#speechSettingsBtn').click();
    await page.goBack();
    await expect(page.locator('#speechSettingsModal')).toBeHidden();
});

for (const width of [320, 360, 375, 390, 768, 1280]) {
    for (const paid of [false, true]) {
        test(`読み上げ設定：枠内 ${width}px ${paid ? '有料' : '無料'}`, async ({ page, baseURL }) => {
            await page.setViewportSize({ width, height: 720 });
            await page.evaluate(paid => {
                hasValidPremiumAccess = () => paid;
                trialState.unlocked = paid;
                updateTrialUI();
            }, paid);
            const ids = ['otherMenuBtn', 'levelCurrentBtn', 'speechSettingsBtn', 'announcementBtn', 'topActionMenuBtn'];
            if (!paid) ids.push('trialTimerDisplay');
            const boxes = await page.evaluate(ids => ids.map(id => {
                const r = document.getElementById(id).getBoundingClientRect();
                return { id, x: r.x, y: r.y, right: r.right, bottom: r.bottom, width: r.width };
            }), ids);
            for (const a of boxes) {
                expect(a.x, a.id).toBeGreaterThanOrEqual(0);
                expect(a.right, a.id).toBeLessThanOrEqual(width);
                for (const b of boxes.filter(b => b.id !== a.id)) {
                    expect(a.right <= b.x || b.right <= a.x || a.bottom <= b.y || b.bottom <= a.y, `${a.id}/${b.id}`).toBeTruthy();
                }
            }
            if (paid) await expect(page.locator('#trialTimerDisplay')).toBeHidden();
            await page.screenshot({ path: `tmp/speech-${width}-${paid ? 'paid' : 'free'}-closed.png` });
            await page.locator('#speechSettingsBtn').click();
            await expect(page.locator('#speechSettingsModal')).toBeVisible();
            const panel = await page.locator('.speech-settings-panel').boundingBox();
            expect(panel.x).toBeGreaterThanOrEqual(0);
            expect(panel.x + panel.width).toBeLessThanOrEqual(width);
            expect(panel.y).toBeGreaterThanOrEqual(0);
            expect(panel.y + panel.height).toBeLessThanOrEqual(720);
            expect(await page.locator('.speech-settings-panel').evaluate(el => el.scrollWidth <= el.clientWidth)).toBeTruthy();
            await page.screenshot({ path: `tmp/speech-${width}-${paid ? 'paid' : 'free'}-open.png` });
            if (paid) await expect(page.locator('#trialTimerDisplay')).toBeHidden();
            await page.getByRole('button', { name: '読み上げ設定を閉じる' }).click();
            await expect(page.locator('#speechSettingsModal')).toBeHidden();
        });
    }
}
