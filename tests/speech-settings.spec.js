const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
    await page.route(/https?:\/\/(?!localhost:8000)/, route => route.abort());
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

test('読み上げ設定：横向き・背景クリック・戻る・フォーカス循環', async ({ page }) => {
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
        test(`読み上げ設定：枠内 ${width}px ${paid ? '有料' : '無料'}`, async ({ page }) => {
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
