const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium, webkit } = require('playwright');
const root = path.resolve(__dirname, '../../..');
const base = process.env.TENIOHA_VERIFY_URL || 'https://tomtommark2.github.io/tenioha-game/';
const version = fs.readFileSync(path.join(root, 'js/version.js'), 'utf8').match(/GAME_VERSION\s*=\s*"([^"]+)"/)[1];

(async () => {
    const files = ['index.html', 'vocab_clicker_game.html', 'js/version.js', 'style.css', 'js/game_logic.js',
        'js/ui_manager.js', 'js/utils.js', 'js/word_illustrations.js', 'js/my_wordbooks.js', 'service_worker.js',
        'data/vocabulary.js', 'data/word-illustrations.js', 'data/announcements.js'];
    for (const file of files) {
        const response = await fetch(base + file + '?v=' + version, { signal: AbortSignal.timeout(30000) });
        assert.equal(response.status, 200, file);
        assert.ok(Buffer.from(await response.arrayBuffer()).equals(fs.readFileSync(path.join(root, file))), file);
    }
    const report = { base, version, checkedFiles: files, contexts: [] };
    for (const [engine, browserType] of [['chromium', chromium], ['webkit', webkit]]) {
        const browser = await browserType.launch();
        try {
            for (const width of [320, 1280]) {
                const context = await browser.newContext({ viewport: { width, height: 900 }, serviceWorkers: 'block' });
                await context.route('**/*', route => new URL(route.request().url()).origin === new URL(base).origin ? route.continue() : route.abort());
                await context.addInitScript(() => {
                    localStorage.setItem('vocabGame_skipWelcome', 'true');
                    localStorage.setItem('vocabGame_disableAutoUpdate', 'true');
                    localStorage.setItem('vocabGame_installGuideDismissed', 'true');
                    localStorage.setItem('vocabGame_lastAutoShownAnnouncementId', '2026-09-11-illustrated-wordbook');
                });
                const page = await context.newPage();
                const errors = [];
                page.on('pageerror', error => errors.push(error.message));
                await page.goto(base + 'index.html?appVersion=' + version);
                await page.waitForFunction(() => !!window.MyWordbooks && typeof startLearningSession === 'function');
                assert.equal(await page.locator('#illustrationModeButton').isVisible(), false);
                const initial = await page.evaluate(() => ({ version: GAME_VERSION, free: WordIllustrations.accessibleWords('illustrated', vocabularyDatabase).length,
                    rows: WORD_ILLUSTRATIONS.length, book: vocabularyDatabase.illustrated.length, trial: TRIAL_CONFIG.LIMIT_SECONDS,
                    my: WordIllustrations.canUseLevel('my'), existing: ['selection1400', 'selection1900', 'sys_2000'].every(level => WordIllustrations.canUseLevel(level)) }));
                assert.deepEqual(initial, { version, free: 100, rows: 4577, book: 4155, trial: 480, my: false, existing: true });
                const records = () => page.evaluate(() => JSON.stringify([gameState.wordStates, gameState.srsData, gameState.reviewScore, gameState.actionCounts]));
                const before = await records();
                await page.evaluate(() => WordIllustrations.setAlwaysVisible(true));
                await page.locator('#illustrationModeButton').click();
                assert.equal(await page.locator('#studySettingsDisplayTab').getAttribute('aria-selected'), 'true');
                assert.equal(await page.getByRole('switch', { name: '正答率・出題理由を表示', exact: true }).count(), 1);
                await page.getByRole('button', { name: '出題・復習設定を閉じる', exact: true }).click();
                assert.equal(await page.locator('#vocabWord').textContent(), 'クリックしてスタート');
                assert.equal(await records(), before);
                await page.reload();
                await page.waitForFunction(() => !!window.MyWordbooks);
                assert.equal(await page.locator('#illustrationModeButton').isVisible(), true);
                await page.evaluate(() => {
                    localStorage.setItem('vocabGame_isUnlocked', 'true');
                    localStorage.setItem('vocabGame_expiry', String(Date.now() + 86400000));
                    refreshPlanAccess();
                    MyWordbooks.open();
                });
                assert.equal(await page.locator('#myWordbookModal').isVisible(), true);
                await page.locator('#myWordbookNewName').fill('公開確認用');
                await page.locator('#myWordbookCreateForm button').click();
                await page.waitForFunction(() => document.getElementById('myWordbookEditorHeading').textContent === '公開確認用');
                await page.locator('#myWordbookSuggest').fill('AP');
                await page.waitForFunction(() => document.querySelector('#myWordbookSuggestions button')?.textContent.includes('apple'));
                await page.locator('#myWordbookSuggestions button').first().click();
                assert.equal(await page.evaluate(() => gameState.myWordbooks[0].wordKeys.length), 1);
                await page.reload();
                await page.waitForFunction(() => !!window.MyWordbooks);
                assert.equal(await page.evaluate(() => gameState.myWordbooks[0].name), '公開確認用');
                assert.equal(await page.evaluate(() => gameState.myWordbooks[0].wordKeys.length), 1);
                await page.evaluate(() => {
                    gameState.currentLevel = 'basic'; gameState.currentMode = 'unlearned'; gameState.reviewMode = 'off';
                    gameState.activeReviewLevels = ['basic']; gameState.wordStates = {}; gameState.srsData = {}; gameState.decks = null;
                    vocabularyDatabase.basic.slice(0, 101).forEach(word => {
                        const key = getWordKeySafe(word, 'basic'); gameState.wordStates[key] = 'weak';
                        gameState.srsData[key] = { dueAt: Date.now() - 1000, recentAnswers: [false], reviewStep: 1, scheduledIntervalDays: 1, successCount: 0, failCount: 1 };
                    });
                    loadVocabularyForLevel(); invalidateLearningProgressSnapshot(); activateLearningSessionUI();
                    const snapshot = updateDisplay(); showNextWord(snapshot);
                });
                await page.waitForFunction(() => document.getElementById('reviewRecommendation').style.display === 'flex');
                assert.equal(await page.locator('#reviewRecommendationText').textContent(), '復習が溜まっています');
                assert.equal(await page.evaluate(() => gameState.reviewMode), 'off');
                const reviewBefore = await records();
                await page.getByRole('button', { name: 'あとで', exact: true }).click();
                assert.equal(await records(), reviewBefore);
                assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
                assert.deepEqual(errors, []);
                report.contexts.push({ engine, width, initial, modeShortcut: true, reload: true, personalBook: true, reviewHint: true, noForcedMode: true, pageErrors: errors });
                await context.close();
            }
        } finally { await browser.close(); }
    }
    fs.writeFileSync(path.join(__dirname, process.env.TENIOHA_VERIFY_URL ? 'local-verification.json' : 'live-verification.json'), JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify(report));
})().catch(error => { console.error(error); process.exitCode = 1; });
