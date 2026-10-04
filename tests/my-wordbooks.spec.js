const { test, expect } = require('@playwright/test');
const errors = new WeakMap();

test.beforeEach(async ({ page, baseURL }) => {
    errors.set(page, []);
    page.on('pageerror', error => errors.get(page).push(error.message));
    const origin = new URL(baseURL).origin;
    await page.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
    await page.addInitScript(() => {
        if (!localStorage.getItem('myWordbookTestPremiumInitialized')) {
            localStorage.setItem('vocabGame_isUnlocked', 'true');
            localStorage.setItem('vocabGame_expiry', String(Date.now() + 86400000));
            localStorage.setItem('myWordbookTestPremiumInitialized', 'true');
        }
        localStorage.setItem('vocabGame_skipWelcome', 'true');
        localStorage.setItem('vocabGame_disableAutoUpdate', 'true');
        localStorage.setItem('vocabGame_installGuideDismissed', 'true');
        localStorage.setItem('vocabGame_lastAutoShownAnnouncementId', '2026-09-11-illustrated-wordbook');
    });
    await page.goto('/index.html');
    await expect(page.locator('#vocabWord')).toHaveText('クリックしてスタート');
});
test.afterEach(async ({ page }) => { expect(errors.get(page)).toEqual([]); });

async function open(page) {
    await page.locator('#levelCurrentBtn').click();
    await page.locator('#wordbookBtn').click();
    await page.locator('#myWordbookOpener').click();
    await expect(page.locator('#myWordbookModal')).toBeVisible();
    await expect(page.getByRole('button', { name: 'マイ単語帳を閉じる', exact: true })).toBeFocused();
}
async function create(page, name = '英語・中間テスト') {
    await open(page);
    await page.locator('#myWordbookNewName').fill(name);
    await expect(page.locator('#myWordbookNewName')).toHaveValue(name);
    await page.locator('#myWordbookCreateForm button').click();
    await expect(page.locator('#myWordbookEditorHeading')).toHaveText(name);
}
async function add(page, words = 'APPLE, school\nhigh school') {
    await page.getByRole('button', { name: '入力して追加', exact: true }).click();
    await page.locator('#myWordbookInput').fill(words);
    await page.getByRole('button', { name: '照合する', exact: true }).click();
    await page.locator('#myWordbookApply').click();
}
function checkbox(page, word) {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return page.getByRole('checkbox', { name: new RegExp(`^${escaped}（`) });
}

async function addCustom(page, word, pos, meaning) {
    await page.getByRole('button', { name: '未収録の語を自分で登録', exact: true }).click();
    await page.locator('#myWordbookCustomWord').fill(word);
    await page.locator('#myWordbookCustomPos').selectOption(pos);
    await page.locator('#myWordbookCustomMeaning').fill(meaning);
    await page.getByRole('button', { name: '意味を保存して追加', exact: true }).click();
}

test('マイ単語帳：作成・貼付け・未知語・重複を確認し再読込で復元', async ({ page }) => {
    await create(page);
    await page.locator('#myWordbookInput').fill('APPLE, apple\nschool\thigh school\nnot-a-real-word');
    await page.getByRole('button', { name: '照合する', exact: true }).click();
    await expect(page.locator('#myWordbookResults')).toContainText('4件を照合：3語一致');
    await expect(page.locator('#myWordbookMissing')).toContainText('not-a-real-word');
    await expect(page.locator('#myWordbookSelectionCount')).toHaveText('3語選択');
    await page.locator('#myWordbookApply').click();
    await expect(page.locator('#myWordbookStatus')).toContainText('3語を追加');
    await page.getByRole('button', { name: '照合する', exact: true }).click();
    await expect(page.locator('#myWordbookApply')).toBeDisabled();
    await expect(page.locator('#myWordbookResults')).toContainText('追加済み 3語');
    const books = await page.evaluate(() => JSON.parse(localStorage.getItem('vocabClickerSave')).myWordbooks);
    await page.reload();
    await open(page);
    await page.locator('#myWordbookLibraryList button').click();
    await expect(page.locator('#myWordbookRows input')).toHaveCount(3);
    expect(await page.evaluate(() => gameState.myWordbooks)).toEqual(books);
});

test('マイ単語帳：復習・苦手・得意・完璧から選択し検索と追加済み除外', async ({ page }) => {
    const chosen = await page.evaluate(() => {
        const entries = [...MyWordbooks.getCatalog().byKey.values()].slice(0, 5);
        entries.forEach((item, index) => {
            gameState.wordStates[item.key] = ['weak', 'weak', 'learned', 'perfect', 'learned'][index];
            Object.assign(ensureSrsEntry(item.key), { dueAt: Date.now() + (index === 4 ? 86400000 : -10000), everWrong: true, firstTryPerfect: false, failCount: 1, successCount: 1 });
        });
        return entries.map(item => ({ key: item.key, word: item.word.word }));
    });
    await create(page);
    await page.getByRole('button', { name: '学習状況から追加', exact: true }).click();
    await expect(page.locator('#myWordbookRows input')).toHaveCount(3);
    await page.locator('#myWordbookSource').selectOption('weak');
    await expect(page.locator('#myWordbookRows input')).toHaveCount(2);
    await page.locator('#myWordbookSearch').fill(chosen[0].word);
    await checkbox(page, chosen[0].word).check();
    await page.locator('#myWordbookApply').click();
    await expect(checkbox(page, chosen[0].word)).toHaveCount(0);
    await page.locator('#myWordbookSearch').fill('');
    for (const filter of ['learned', 'perfect']) {
        await page.locator('#myWordbookSource').selectOption(filter);
        await page.locator('#myWordbookSelectShown').click();
        await page.locator('#myWordbookApply').click();
    }
    expect((await page.evaluate(() => gameState.myWordbooks[0].wordKeys)).sort())
        .toEqual([chosen[0], chosen[2], chosen[3], chosen[4]].map(item => item.key).sort());
});

test('マイ単語帳：学習・復習は選択冊内だけで全語は完璧も出し履歴とUndoを共有', async ({ page }) => {
    await create(page);
    await add(page, 'apple, school');
    const keys = await page.evaluate(() => {
        const keys = gameState.myWordbooks[0].wordKeys;
        keys.forEach(key => { gameState.wordStates[key] = 'perfect'; Object.assign(ensureSrsEntry(key), { firstTryPerfect: true, successCount: 1, recentAnswers: [true] }); });
        const outside = [...MyWordbooks.getCatalog().byKey.keys()].find(key => !keys.includes(key));
        gameState.wordStates[outside] = 'weak';
        Object.assign(ensureSrsEntry(outside), { dueAt: Date.now() - 1000, everWrong: true, failCount: 1 });
        gameState.reviewMode = 'off';
        return keys;
    });
    await page.locator('#myWordbookStart').click();
    await expect(page.locator('#myWordbookStudyBar')).toBeVisible();
    expect(await page.evaluate(() => gameState.currentMode)).toBe('all');
    const before = await page.evaluate(() => ({ key: getWordKeySafe(gameState.currentWord), score: gameState.reviewScore.total, srs: JSON.stringify(gameState.srsData[getWordKeySafe(gameState.currentWord)]) }));
    expect(keys).toContain(before.key);
    await page.locator('#vocabCard').click();
    expect(await page.evaluate(() => gameState.reviewScore.total)).toBe(before.score);
    await page.locator('#undoBtn').click();
    expect(await page.evaluate(key => JSON.stringify(gameState.srsData[key]), before.key)).toBe(before.srs);
    expect(await page.evaluate(() => gameState.myWordbooks[0].wordKeys)).toEqual(keys);
    expect(await page.evaluate(() => buildReviewQueueSnapshot().stats.dueNow)).toBe(0);
    await page.evaluate(key => {
        gameState.wordStates[key] = 'weak';
        Object.assign(ensureSrsEntry(key), { dueAt: Date.now() - 10000, firstTryPerfect: false, everWrong: true });
        setReviewMode('on');
    }, keys[0]);
    expect(await page.evaluate(() => getWordKeySafe(gameState.currentWord))).toBe(keys[0]);
    expect(await page.evaluate(() => buildReviewQueueSnapshot().stats.dueNow)).toBe(1);
    await page.locator('#vocabCard').click();
    expect(await page.evaluate(() => gameState.reviewScore.total)).toBeGreaterThan(before.score);
    await page.reload();
    expect(await page.evaluate(() => gameState.currentLevel)).toBe('my');
    expect(await page.evaluate(() => gameState.activeMyWordbookId)).not.toBeNull();
    await page.locator('#myWordbookAllBtn').click();
    expect(keys).toContain(await page.evaluate(() => getWordKeySafe(gameState.currentWord)));
});

test('マイ単語帳：名前変更・単語を外す・削除でも履歴を保持し複数冊作れる', async ({ page }) => {
    page.on('dialog', dialog => dialog.accept());
    await create(page);
    await add(page, 'apple');
    const key = await page.evaluate(() => {
        const key = gameState.myWordbooks[0].wordKeys[0];
        gameState.wordStates[key] = 'weak'; Object.assign(ensureSrsEntry(key), { failCount: 1, everWrong: true });
        return key;
    });
    await page.locator('.my-wordbook-options summary').click();
    await page.locator('#myWordbookName').fill('テスト範囲・改');
    await page.locator('#myWordbookRenameForm button').click();
    await expect(page.locator('#myWordbookEditorHeading')).toHaveText('テスト範囲・改');
    await page.getByRole('button', { name: '登録した単語', exact: true }).click();
    await page.locator('#myWordbookSelectShown').click();
    await page.locator('#myWordbookApply').click();
    expect(await page.evaluate(key => gameState.wordStates[key], key)).toBe('weak');
    await page.getByRole('button', { name: '単語帳を削除', exact: true }).click();
    await expect(page.locator('#myWordbookLibraryEmpty')).toBeVisible();
    expect(await page.evaluate(key => gameState.srsData[key].failCount, key)).toBe(1);
    for (const name of ['別の単語帳', '三冊目']) {
        await page.locator('#myWordbookNewName').fill(name);
        await page.locator('#myWordbookCreateForm button').click();
        await add(page, 'school');
        await page.getByRole('button', { name: '‹ 単語帳一覧', exact: true }).click();
    }
    expect(await page.evaluate(() => gameState.myWordbooks.length)).toBe(2);
});

test('マイ単語帳：保存失敗は追加・名前変更・削除を戻す', async ({ page }) => {
    await create(page);
    await add(page, 'apple');
    await page.locator('#myWordbookInput').fill('school');
    await page.getByRole('button', { name: '照合する', exact: true }).click();
    const before = await page.evaluate(() => JSON.stringify(gameState.myWordbooks));
    await page.evaluate(() => { window.savedMyBookSave = window.saveGame; window.saveGame = () => false; });
    await page.locator('#myWordbookApply').click();
    await expect(page.locator('#myWordbookStatus')).toContainText('保存できませんでした');
    expect(await page.evaluate(() => JSON.stringify(gameState.myWordbooks))).toBe(before);
    await page.locator('.my-wordbook-options summary').click();
    await page.locator('#myWordbookName').fill('失敗');
    await page.locator('#myWordbookRenameForm button').click();
    expect(await page.evaluate(() => JSON.stringify(gameState.myWordbooks))).toBe(before);
    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: '単語帳を削除', exact: true }).click();
    expect(await page.evaluate(() => JSON.stringify(gameState.myWordbooks))).toBe(before);
    await page.evaluate(() => { window.saveGame = window.savedMyBookSave; });
});

test('マイ単語帳：特殊文字・320px・閉じる・戻る・フォーカスを維持', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 740 });
    await create(page, '<img src=x onerror=alert(1)>');
    await add(page, 'apple, school');
    await page.getByRole('button', { name: '‹ 単語帳一覧', exact: true }).click();
    await expect(page.locator('#myWordbookLibraryList img')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.keyboard.press('Escape');
    await expect(page.locator('#myWordbookModal')).toBeHidden();
    await expect(page.locator('#levelCurrentBtn')).toBeFocused();
    await expect.poll(() => page.evaluate(() => !!history.state?.__teniohaModalLayer)).toBe(false);
    await page.locator('#levelCurrentBtn').focus();
    await page.evaluate(() => MyWordbooks.open());
    await page.locator('#myWordbookModal').click({ position: { x: 2, y: 2 } });
    await expect(page.locator('#myWordbookModal')).toBeHidden();
    await expect(page.locator('#levelCurrentBtn')).toBeFocused();
    await expect.poll(() => page.evaluate(() => !!history.state?.__teniohaModalLayer)).toBe(false);
    await page.evaluate(() => MyWordbooks.open());
    await expect.poll(() => page.evaluate(() => !!history.state?.__teniohaModalLayer)).toBe(true);
    await page.evaluate(() => history.back());
    await expect(page.locator('#myWordbookModal')).toBeHidden();
    await expect(page.locator('#levelCurrentBtn')).toBeFocused();
});

test('マイ単語帳：60語のページ区切りでも選択を保持', async ({ page }) => {
    const words = await page.evaluate(() => [...MyWordbooks.getCatalog().byKey.values()].slice(0, 70).map(item => item.word.word).join('\n'));
    await create(page);
    await page.locator('#myWordbookInput').fill(words);
    await page.getByRole('button', { name: '照合する', exact: true }).click();
    await expect(page.locator('#myWordbookRows input')).toHaveCount(60);
    await page.getByRole('button', { name: '選択解除', exact: true }).click();
    await page.locator('#myWordbookSelectShown').click();
    await page.locator('#myWordbookNext').click();
    await expect(page.locator('#myWordbookRows input')).toHaveCount(10);
    await expect(page.locator('#myWordbookSelectionCount')).toHaveText('60語選択');
    await page.locator('#myWordbookSelectShown').click();
    await page.locator('#myWordbookApply').click();
    expect(await page.evaluate(() => gameState.myWordbooks[0].wordKeys.length)).toBe(70);
});

test('マイ単語帳：学習中の編集・削除で範囲とUndoを更新し通常レベルへ戻れる', async ({ page }) => {
    page.on('dialog', dialog => dialog.accept());
    await create(page);
    await add(page, 'apple, school');
    await page.locator('#myWordbookStart').click();
    await page.locator('#vocabCard').click();
    await expect(page.locator('#undoBtn')).toBeEnabled();
    const current = await page.evaluate(() => ({ key: getWordKeySafe(gameState.currentWord), word: gameState.currentWord.word }));
    await page.locator('#myWordbookStudyBar').getByRole('button', { name: '編集', exact: true }).click();
    await checkbox(page, current.word).check();
    await page.locator('#myWordbookApply').click();
    expect(await page.evaluate(key => gameState.myWordbooks[0].wordKeys.includes(key), current.key)).toBe(false);
    expect(await page.evaluate(() => getWordKeySafe(gameState.currentWord))).not.toBe(current.key);
    await expect(page.locator('#undoBtn')).toBeDisabled();
    await page.locator('.my-wordbook-options summary').click();
    await page.getByRole('button', { name: '単語帳を削除', exact: true }).click();
    expect(await page.evaluate(() => gameState.currentLevel)).toBe('basic');
    expect(await page.evaluate(() => gameState.currentMode)).toBe('unlearned');
    expect(await page.evaluate(() => gameState.activeMyWordbookId)).toBeNull();
    await expect(page.locator('#myWordbookStudyBar')).toBeHidden();
    await page.keyboard.press('Escape');
    await page.reload();
    expect(await page.evaluate(() => gameState.currentLevel)).toBe('basic');
});

test('マイ単語帳：複数冊の切替・単語一覧・復習設定と最後の通常レベルを維持', async ({ page }) => {
    await create(page, '一冊目');
    await add(page, 'apple');
    await page.getByRole('button', { name: '‹ 単語帳一覧', exact: true }).click();
    await page.locator('#myWordbookNewName').fill('二冊目');
    await page.locator('#myWordbookCreateForm button').click();
    await add(page, 'school');
    await page.locator('#myWordbookStart').click();
    await expect(page.locator('#vocabWord')).toContainText('school');
    expect(await page.evaluate(() => gameState.currentWord.word)).toBe('school');
    await page.evaluate(() => openWordListModal());
    await expect(page.locator('#wordListMeta')).toContainText('1語');
    await expect(page.locator('#wordListGrid .word-list-card')).toHaveCount(1);
    await page.keyboard.press('Escape');
    await page.evaluate(() => openStudyModeModal());
    await page.locator('.study-scope-card summary').filter({ hasText: '出題範囲' }).click();
    await expect(page.locator('#myWordbookReviewScopeNote')).toBeVisible();
    await expect(page.locator('[data-review-level="junior"]')).toBeDisabled();
    await expect(page.locator('#dueOnlyModeLabelModal')).toHaveText('単語帳の全語');
    await page.keyboard.press('Escape');
    await page.locator('#myWordbookStudyBar').getByRole('button', { name: '編集', exact: true }).click();
    await page.getByRole('button', { name: '‹ 単語帳一覧', exact: true }).click();
    await page.locator('#myWordbookLibraryList button').filter({ hasText: '一冊目' }).click();
    await page.locator('#myWordbookStart').click();
    await expect(page.locator('#vocabWord')).toContainText('apple');
    expect(await page.evaluate(() => gameState.currentWord.word)).toBe('apple');
    await page.locator('#myWordbookStudyBar').getByRole('button', { name: '通常の学習へ', exact: true }).click();
    await page.reload();
    expect(await page.evaluate(() => gameState.currentMode)).toBe('unlearned');
    expect(await page.evaluate(() => gameState.myWordbooks.length)).toBe(2);
    // Cloud state can contain all-mode while the local navigation preference is a normal level.
    await page.evaluate(() => {
        const data = JSON.parse(localStorage.getItem('vocabClickerSave'));
        Object.assign(data, { currentLevel: 'my', currentMode: 'all' });
        localStorage.setItem('vocabClickerSave', JSON.stringify(data));
        localStorage.setItem('vocabGame_lastLevel', 'daily');
    });
    await page.reload();
    expect(await page.evaluate(() => ({ level: gameState.currentLevel, mode: gameState.currentMode }))).toEqual({ level: 'daily', mode: 'unlearned' });
});

test('マイ単語帳：品詞・キュー範囲を維持し登録でSRSを増やさず期限切れで通常へ戻る', async ({ page }) => {
    await create(page);
    await add(page, 'apple, school');
    expect(await page.evaluate(() => gameState.myWordbooks[0].wordKeys.every(key => !(key in gameState.srsData)))).toBe(true);
    await page.evaluate(() => {
        gameState.activeReviewLevels = ['daily'];
        gameState.myWordbooks[0].wordKeys.forEach(key => {
            gameState.wordStates[key] = 'weak'; Object.assign(ensureSrsEntry(key), { dueAt: Date.now() - 1000, everWrong: true });
        });
    });
    await page.getByRole('button', { name: '学習状況から追加', exact: true }).click();
    await expect(page.locator('#myWordbookResults')).toHaveText('0語');
    await page.locator('#myWordbookStart').click();
    expect(await page.evaluate(() => buildReviewQueueSnapshot().stats.dueNow)).toBe(2);
    await page.evaluate(() => {
        gameState.posFilters = ['動'];
        gameState.decks = null;
        showNextWord();
    });
    expect(await page.evaluate(() => buildReviewQueueSnapshot().stats.dueNow)).toBe(0);
    expect(await page.locator('.no-words').count()).toBe(1);
    await page.evaluate(() => {
        gameState.posFilters = ['名'];
        localStorage.setItem('vocabGame_expiry', String(Date.now() - 1000));
        updateTrialTimer();
    });
    expect(await page.evaluate(() => gameState.currentLevel)).toBe('basic');
    expect(await page.evaluate(() => gameState.currentMode)).toBe('unlearned');
    const before = await page.evaluate(() => gameState.globalQuestionCount);
    await page.evaluate(() => MyWordbooks.practiceAll());
    expect(await page.evaluate(() => gameState.globalQuestionCount)).toBe(before);
    expect(await page.evaluate(() => gameState.myWordbooks[0].wordKeys.length)).toBe(2);
});

test('マイ単語帳：A・APの前方一致候補と登録一覧の絞り込みを即時更新', async ({ page }, testInfo) => {
    await create(page);
    await page.locator('#myWordbookSuggest').fill('A');
    expect(await page.locator('#myWordbookSuggestions strong').allTextContents()).toEqual(expect.arrayContaining([expect.stringMatching(/^a/i)]));
    expect((await page.locator('#myWordbookSuggestions strong').allTextContents()).every(word => /^a/i.test(word))).toBe(true);
    await page.locator('#myWordbookSuggest').fill('AP');
    const words = await page.locator('#myWordbookSuggestions strong').allTextContents();
    expect(words.some(word => word.startsWith('apple（'))).toBe(true);
    expect(words.every(word => /^ap/i.test(word))).toBe(true);
    await page.screenshot({ path: `screenshots/my-wordbook-suggestions-${testInfo.project.name}.png` });
    await page.locator('#myWordbookSuggestions button').filter({ hasText: 'apple（' }).click();
    await expect(page.locator('#myWordbookSuggestions button').filter({ hasText: 'apple（' })).toBeDisabled();
    await add(page, 'school');
    await page.getByRole('button', { name: '登録した単語', exact: true }).click();
    await page.locator('#myWordbookSearch').fill('AP');
    await expect(page.locator('#myWordbookRows input')).toHaveCount(1);
    await expect(page.locator('#myWordbookRows')).toContainText('apple');
    await page.locator('#myWordbookSearch').fill('ppl');
    await expect(page.locator('#myWordbookRows input')).toHaveCount(0);
    await page.locator('#myWordbookSearch').fill('学校');
    await expect(page.locator('#myWordbookRows')).toContainText('school');
});

test('マイ単語帳：統合カードは品詞ごとの意味を表示し元の一履歴を維持', async ({ page }) => {
    await create(page);
    const item = await page.evaluate(() => {
        const item = [...MyWordbooks.getCatalog().byKey.values()].find(item => new Set((item.word.senses || []).map(sense => sense.pos)).size > 1);
        return { key: item.key, word: item.word.word, senses: item.word.senses };
    });
    await page.locator('#myWordbookSuggest').fill(item.word);
    const candidate = page.locator('#myWordbookSuggestions button').filter({ has: page.locator('strong').filter({ hasText: `${item.word}（` }) });
    for (const sense of item.senses) await expect(candidate).toContainText(sense.meaning.replace(/^【[名動形副助接前代冠数間限定]】\s*/, ''));
    await candidate.click();
    expect(await page.evaluate(() => gameState.myWordbooks[0].wordKeys)).toEqual([item.key]);
    await page.locator('#myWordbookStart').click();
    expect(await page.evaluate(() => getWordKeySafe(gameState.currentWord))).toBe(item.key);
    expect(await page.evaluate(() => gameState.currentWord.senses.length)).toBe(item.senses.length);
});

test('マイ単語帳：未収録語を意味付きで登録し同綴りの品詞を区別・保存・復習・Undo', async ({ page }) => {
    await create(page);
    await page.locator('#myWordbookInput').fill('quux-study');
    await page.getByRole('button', { name: '照合する', exact: true }).click();
    await page.getByRole('button', { name: 'quux-study の意味を入力', exact: true }).click();
    await expect(page.locator('#myWordbookCustomWord')).toHaveValue('quux-study');
    await page.getByRole('button', { name: '意味を保存して追加', exact: true }).click();
    expect(await page.evaluate(() => gameState.myCustomWords.length)).toBe(0);
    await page.locator('#myWordbookCustomMeaning').fill('<img src=x onerror=alert(1)> 自分の意味');
    await page.getByRole('button', { name: '意味を保存して追加', exact: true }).click();
    await addCustom(page, 'quux-study', '動', '自分で決めた動作');
    expect(await page.evaluate(() => gameState.myCustomWords.length)).toBe(2);
    const keys = await page.evaluate(() => gameState.myWordbooks[0].wordKeys);
    expect(new Set(keys).size).toBe(2);
    await page.locator('#myWordbookSuggest').fill('quux-study');
    await expect(page.locator('#myWordbookSuggestions button')).toHaveCount(2);
    await expect(page.locator('#myWordbookSuggestions')).toContainText('名詞');
    await expect(page.locator('#myWordbookSuggestions')).toContainText('動詞');
    await expect(page.locator('#myWordbookSuggestions img')).toHaveCount(0);
    await page.locator('#myWordbookStart').click();
    await page.locator('#meaningCard').click();
    const answeredKey = await page.evaluate(() => getWordKeySafe(gameState.currentWord));
    expect(await page.evaluate(key => gameState.srsData[key].recentAnswers, answeredKey)).toEqual([false]);
    await expect(page.locator('#meaningText img')).toHaveCount(0);
    await page.locator('#undoBtn').click();
    expect(await page.evaluate(key => gameState.srsData[key].recentAnswers || [], answeredKey)).toEqual([]);
    await page.evaluate(() => {
        gameState.myWordbooks[0].wordKeys.forEach(key => {
            gameState.wordStates[key] = 'weak';
            Object.assign(ensureSrsEntry(key), { dueAt: Date.now() - 1000, everWrong: true, firstTryPerfect: false });
        });
        setReviewMode('on');
    });
    expect(await page.evaluate(() => buildReviewQueueSnapshot().stats.dueNow)).toBe(2);
    const score = await page.evaluate(() => JSON.stringify(gameState.reviewScore));
    await page.locator('#vocabCard').click();
    expect(await page.evaluate(() => JSON.stringify(gameState.reviewScore))).toBe(score);
    await page.reload();
    expect(await page.evaluate(() => gameState.myCustomWords.length)).toBe(2);
    expect(await page.evaluate(() => gameState.myWordbooks[0].wordKeys)).toEqual(keys);
    expect(await page.evaluate(() => Object.values(gameState.srsData).some(entry => entry.recentAnswers?.includes(true)))).toBe(true);
});

test('マイ単語帳：自作語の重複は増やさず複数冊で共有し除外・削除で履歴を失わない', async ({ page }) => {
    page.on('dialog', dialog => dialog.accept());
    await create(page);
    await addCustom(page, 'quux-study', '名', '独自の意味');
    await addCustom(page, 'QUUX-STUDY', '名', '別の意味で上書きしない');
    expect(await page.evaluate(() => gameState.myCustomWords.length)).toBe(1);
    await expect(page.locator('#myWordbookStatus')).toContainText('追加済み');
    await page.getByRole('button', { name: 'キャンセル', exact: true }).click();
    const key = await page.evaluate(() => {
        const key = gameState.myWordbooks[0].wordKeys[0];
        gameState.wordStates[key] = 'weak'; Object.assign(ensureSrsEntry(key), { recentAnswers: [false], everWrong: true });
        saveGame(); return key;
    });
    await page.getByRole('button', { name: '‹ 単語帳一覧', exact: true }).click();
    await page.locator('#myWordbookNewName').fill('二冊目');
    await page.locator('#myWordbookCreateForm button').click();
    await addCustom(page, 'quux-study', '名', '違う意味');
    expect(await page.evaluate(() => gameState.myCustomWords.length)).toBe(1);
    expect(await page.evaluate(() => gameState.myCustomWords[0].meaning)).toBe('独自の意味');
    expect(await page.evaluate(() => gameState.myWordbooks[1].wordKeys)).toEqual([key]);
    await page.getByRole('button', { name: '登録した単語', exact: true }).click();
    await page.locator('#myWordbookSelectShown').click();
    await page.locator('#myWordbookApply').click();
    await page.locator('.my-wordbook-options summary').click();
    await page.getByRole('button', { name: '単語帳を削除', exact: true }).click();
    await page.reload();
    expect(await page.evaluate(key => gameState.srsData[key].recentAnswers, key)).toEqual([false]);
    expect(await page.evaluate(() => gameState.myCustomWords[0].meaning)).toBe('独自の意味');
    expect(await page.evaluate(() => gameState.myWordbooks[0].wordKeys)).toEqual([key]);
});

test('マイ単語帳：自作語保存の失敗を戻し収録語の意味を上書きしない', async ({ page }) => {
    await create(page);
    await addCustom(page, 'apple', '名', '収録語を上書きしない');
    await expect(page.locator('#myWordbookStatus')).toContainText('収録済みの語です');
    expect(await page.evaluate(() => gameState.myCustomWords.length)).toBe(0);
    await page.getByRole('button', { name: 'キャンセル', exact: true }).click();
    await page.evaluate(() => { window.savedMyBookSave = window.saveGame; window.saveGame = () => false; });
    await addCustom(page, 'quux-study', '名', '保存失敗のテスト');
    await expect(page.locator('#myWordbookStatus')).toContainText('保存できませんでした');
    expect(await page.evaluate(() => gameState.myCustomWords.length)).toBe(0);
    expect(await page.evaluate(() => gameState.myWordbooks[0].wordKeys)).toEqual([]);
    await page.evaluate(() => { window.saveGame = window.savedMyBookSave; });
});

test('マイ単語帳：無料・期限切れの作成編集学習を止めデータは保持し再開できる', async ({ page }) => {
    await create(page);
    await addCustom(page, 'quux-study', '名', '期限切れでも保持');
    await page.locator('#myWordbookStart').click();
    const saved = await page.evaluate(() => ({ books: gameState.myWordbooks, words: gameState.myCustomWords }));
    await page.evaluate(() => localStorage.setItem('vocabGame_expiry', String(Date.now() - 1000)));
    await page.reload();
    expect(await page.evaluate(() => ({ books: gameState.myWordbooks, words: gameState.myCustomWords }))).toEqual(saved);
    expect(await page.evaluate(() => gameState.currentLevel)).toBe('basic');
    expect(await page.evaluate(() => gameState.currentMode)).toBe('unlearned');
    await page.locator('#levelCurrentBtn').click();
    await page.locator('#wordbookBtn').click();
    await expect(page.locator('#myWordbookPremiumBadge')).toHaveText('プレミアム');
    await page.locator('#myWordbookOpener').click();
    await expect(page.locator('#profileModal')).toBeVisible();
    await expect(page.locator('#myWordbookModal')).toBeHidden();
    const before = await page.evaluate(() => JSON.stringify(gameState.myWordbooks));
    await page.evaluate(() => {
        MyWordbooks.openEditor(gameState.myWordbooks[0].id);
        MyWordbooks.startStudy();
        MyWordbooks.applySelection();
        switchLevel('my');
        MyWordbooks.practiceAll();
    });
    expect(await page.evaluate(() => JSON.stringify(gameState.myWordbooks))).toBe(before);
    expect(await page.evaluate(() => gameState.currentLevel)).toBe('basic');
    await page.reload();
    await page.evaluate(() => {
        localStorage.setItem('vocabGame_isUnlocked', 'true');
        localStorage.setItem('vocabGame_expiry', String(Date.now() + 86400000));
        updateTrialTimer();
    });
    await open(page);
    await page.locator('#myWordbookLibraryList button').click();
    await page.locator('#myWordbookStart').click();
    await expect(page.locator('#vocabWord')).toContainText('quux-study');
});

test('マイ単語帳：長い自作語・意味も320pxで読め、通常のカードには影響しない', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 320, height: 740 });
    await create(page);
    const word = `custom-${'a'.repeat(110)}`;
    const meaning = `本人が入力した意味（⇔記号も保持）\n${'長い意味'.repeat(110)}`;
    await addCustom(page, word, '名', meaning);
    await page.locator('#myWordbookStart').click();
    await expect(page.locator('.word-text-main')).toHaveText(word);
    expect(await page.locator('.word-text-main').evaluate(element => {
        const bounds = element.getBoundingClientRect(), card = element.closest('.card').getBoundingClientRect();
        return bounds.left >= card.left && bounds.right <= card.right;
    })).toBe(true);
    await page.locator('#meaningCard').click();
    await expect(page.locator('.my-custom-meaning')).toHaveText(meaning);
    await expect(page.locator('.my-custom-meaning')).toHaveCSS('overflow-y', 'auto');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `screenshots/my-wordbook-custom-long-${testInfo.project.name}.png` });
    await page.locator('#myWordbookStudyBar').getByRole('button', { name: '通常の学習へ', exact: true }).click();
    await expect(page.locator('#cardsArea')).not.toHaveClass(/has-custom-word/);
});

test('マイ単語帳：入力と学習のプレビューをPC・スマホで保存', async ({ page }, testInfo) => {
    await create(page);
    await page.locator('#myWordbookInput').fill('apple\nschool\nhigh school\nnot-a-real-word');
    await page.getByRole('button', { name: '照合する', exact: true }).click();
    await page.locator('#myWordbookInput').focus();
    await page.screenshot({ path: `screenshots/my-wordbook-input-${testInfo.project.name}.png` });
    await page.locator('#myWordbookApply').click();
    await page.locator('#myWordbookStart').click();
    await expect(page.locator('#myWordbookStudyBar')).toHaveCSS('position', 'relative');
    await expect(page.locator('#myWordbookStudyBar')).toHaveCSS('z-index', '1');
    await expect(page.locator('#myWordbookStudyBar')).toBeVisible();
    await page.screenshot({ path: `screenshots/my-wordbook-study-${testInfo.project.name}.png` });
});

function noteButton(page, word) {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return page.getByRole('button', { name: new RegExp(`^${escaped}（.*）の自分用メモを編集$`) });
}

async function saveNote(page, word, meaning, memo = '') {
    await noteButton(page, word).click();
    await page.locator('#myWordbookNoteMeaning').fill(meaning);
    await page.locator('#myWordbookNoteMemo').fill(memo);
    await page.getByRole('button', { name: 'メモを保存', exact: true }).click();
}

test('マイ単語帳：自作語の意味編集は固定ID・品詞・復習予定を保ちUndoで戻らない', async ({ page }) => {
    await create(page);
    await addCustom(page, 'quux-study', '名', '修正前の意味');
    await page.locator('#myWordbookStart').click();
    await page.locator('#meaningCard').click();
    const before = await page.evaluate(() => ({ id: gameState.myCustomWords[0].id, keys: gameState.myWordbooks[0].wordKeys,
        history: gameState.srsData, score: gameState.reviewScore, count: gameState.globalQuestionCount, actions: gameState.actionCounts }));
    await page.locator('#myWordbookStudyBar').getByRole('button', { name: '編集', exact: true }).click();
    await page.getByRole('button', { name: 'quux-study（名詞）の意味を編集', exact: true }).click();
    await expect(page.locator('#myWordbookCustomWord')).toHaveAttribute('readonly', '');
    await expect(page.locator('#myWordbookCustomPos')).toBeDisabled();
    await expect(page.locator('#myWordbookCustomHelp')).toContainText('すべてのマイ単語帳');
    await page.locator('#myWordbookCustomMeaning').fill('<b>修正後</b> ⇔ 本人の意味\n改行も保持');
    await page.getByRole('button', { name: '変更を保存', exact: true }).click();
    expect(await page.evaluate(() => ({ id: gameState.myCustomWords[0].id, keys: gameState.myWordbooks[0].wordKeys,
        history: gameState.srsData, score: gameState.reviewScore, count: gameState.globalQuestionCount, actions: gameState.actionCounts }))).toEqual(before);
    await page.getByRole('button', { name: 'マイ単語帳を閉じる', exact: true }).click();
    await expect(page.locator('#meaningText')).toContainText('<b>修正後</b>');
    await expect(page.locator('#meaningText b')).toHaveCount(0);
    expect(await page.evaluate(() => gameState.meaningCardFlipped)).toBe(true);
    await expect(page.locator('#undoBtn')).toBeEnabled();
    await page.locator('#undoBtn').click();
    await expect(page.locator('#meaningText')).toContainText('修正後');
    expect(await page.evaluate(key => gameState.srsData[key]?.recentAnswers || [], before.keys[0])).toEqual([]);
    await page.locator('#vocabCard').click();
    await expect(page.locator('#meaningText')).toContainText('修正後');
    await page.reload();
    expect(await page.evaluate(() => gameState.myCustomWords[0].meaning)).toContain('<b>修正後</b>');
    expect(await page.evaluate(() => gameState.myWordbooks[0].wordKeys)).toEqual(before.keys);
});

test('マイ単語帳：収録語の自分用メモは元の意味・採点を保ち意味カードと一覧に安全表示', async ({ page }, testInfo) => {
    await create(page);
    await add(page, 'apple');
    await page.getByRole('button', { name: '登録した単語', exact: true }).click();
    const before = await page.evaluate(() => ({ database: JSON.stringify(vocabularyDatabase.junior),
        history: JSON.stringify(gameState.srsData), score: JSON.stringify(gameState.reviewScore), count: gameState.globalQuestionCount }));
    await saveNote(page, 'apple', '授業での訳：リンゴ ⇔\n自分用の訳', '<img src=x onerror=alert(1)> 覚え方');
    await expect(page.locator('#myWordbookSelectionCount')).toHaveText('0語選択');
    await expect(page.locator('.my-wordbook-note-preview')).toContainText('授業での訳');
    await expect(page.locator('#myWordbookRows img')).toHaveCount(0);
    expect(await page.evaluate(() => ({ database: JSON.stringify(vocabularyDatabase.junior),
        history: JSON.stringify(gameState.srsData), score: JSON.stringify(gameState.reviewScore), count: gameState.globalQuestionCount }))).toEqual(before);
    await page.locator('#myWordbookStart').click();
    await page.locator('#meaningCard').click();
    await expect(page.locator('.my-original-meaning')).toContainText('リンゴ');
    await expect(page.locator('.my-study-note')).toContainText('授業での訳');
    await expect(page.locator('.my-study-note')).toContainText('<img src=x onerror=alert(1)>');
    await expect(page.locator('.my-study-note img')).toHaveCount(0);
    await page.locator('#myWordbookStudyBar').getByRole('button', { name: '編集', exact: true }).click();
    await saveNote(page, 'apple', '授業での訳：リンゴ', 'red apple＝赤いリンゴ。セットで覚える。');
    await page.getByRole('button', { name: 'マイ単語帳を閉じる', exact: true }).click();
    await page.screenshot({ path: `screenshots/my-wordbook-personal-note-${testInfo.project.name}.png` });
    await page.locator('#undoBtn').click();
    await expect(page.locator('.my-study-note')).toContainText('授業での訳');
    await page.locator('#myWordbookStudyBar').getByRole('button', { name: '通常の学習へ', exact: true }).click();
    await expect(page.locator('.my-study-note')).toHaveCount(0);
    expect(await page.evaluate(() => JSON.stringify(vocabularyDatabase.junior))).toBe(before.database);
});

test('マイ単語帳：教材別のメモと共有自作語の意味を区別し除外再追加・消去・再読込を保持', async ({ page }) => {
    test.setTimeout(60000);
    page.on('dialog', dialog => dialog.accept());
    await create(page, '教材A');
    await addCustom(page, 'quux-study', '名', '共有する意味');
    await page.getByRole('button', { name: '登録した単語', exact: true }).click();
    await saveNote(page, 'quux-study', '教材Aの訳', '教材Aの覚え方');
    const firstId = await page.evaluate(() => gameState.myWordbooks[0].id);
    await page.getByRole('button', { name: '‹ 単語帳一覧', exact: true }).click();
    await page.locator('#myWordbookNewName').fill('教材B');
    await page.locator('#myWordbookCreateForm button').click();
    await addCustom(page, 'quux-study', '名', '勝手に上書きしない');
    await page.getByRole('button', { name: '登録した単語', exact: true }).click();
    await expect(page.locator('.my-wordbook-note-preview')).toHaveCount(0);
    await saveNote(page, 'quux-study', '教材Bの訳');
    await page.getByRole('button', { name: 'quux-study（名詞）の意味を編集', exact: true }).click();
    await page.locator('#myWordbookCustomMeaning').fill('全冊共通の修正版');
    await page.getByRole('button', { name: '変更を保存', exact: true }).click();
    const key = await page.evaluate(() => gameState.myWordbooks[1].wordKeys[0]);
    await checkbox(page, 'quux-study').check();
    await page.locator('#myWordbookApply').click();
    await add(page, 'quux-study');
    await page.getByRole('button', { name: '登録した単語', exact: true }).click();
    await expect(page.locator('.my-wordbook-note-preview')).toContainText('教材Bの訳');
    await saveNote(page, 'quux-study', '');
    await expect(page.locator('.my-wordbook-note-preview')).toHaveCount(0);
    await page.evaluate(id => MyWordbooks.openEditor(id), firstId);
    await expect(page.locator('#myWordbookRows')).toContainText('全冊共通の修正版');
    await expect(page.locator('.my-wordbook-note-preview')).toContainText('教材Aの訳');
    await page.reload();
    expect(await page.evaluate(key => gameState.myWordbooks.map(book => book.wordNotes[key]?.meaning || ''), key)).toEqual(['教材Aの訳', '']);
    expect(await page.evaluate(() => gameState.myCustomWords.length)).toBe(1);
    expect(await page.evaluate(() => gameState.myCustomWords[0].meaning)).toBe('全冊共通の修正版');
});

test('マイ単語帳：意味編集・メモのキャンセルと保存失敗で定義・入力・履歴を保つ', async ({ page }) => {
    await create(page);
    await addCustom(page, 'quux-study', '名', '元の意味');
    await page.getByRole('button', { name: '登録した単語', exact: true }).click();
    await saveNote(page, 'quux-study', '元の自分の訳');
    const before = await page.evaluate(() => JSON.stringify({ books: gameState.myWordbooks, words: gameState.myCustomWords, history: gameState.srsData }));
    await noteButton(page, 'quux-study').click();
    await page.locator('#myWordbookNoteMeaning').fill('キャンセルする訳');
    await page.locator('#myWordbookNoteForm').getByRole('button', { name: 'キャンセル', exact: true }).click();
    await expect(page.locator('#myWordbookEditorHeading')).toBeFocused();
    await page.evaluate(() => { window.savedMyBookSave = window.saveGame; window.saveGame = () => false; });
    await saveNote(page, 'quux-study', '保存失敗する訳');
    await expect(page.locator('#myWordbookStatus')).toContainText('保存できませんでした');
    await expect(page.locator('#myWordbookNoteMeaning')).toHaveValue('保存失敗する訳');
    await page.locator('#myWordbookNoteForm').getByRole('button', { name: 'キャンセル', exact: true }).click();
    await page.getByRole('button', { name: 'quux-study（名詞）の意味を編集', exact: true }).click();
    await page.locator('#myWordbookCustomMeaning').fill('保存失敗する意味');
    await page.getByRole('button', { name: '変更を保存', exact: true }).click();
    await expect(page.locator('#myWordbookStatus')).toContainText('保存できませんでした');
    expect(await page.evaluate(() => JSON.stringify({ books: gameState.myWordbooks, words: gameState.myCustomWords, history: gameState.srsData }))).toBe(before);
    await page.locator('#myWordbookCustomForm').getByRole('button', { name: 'キャンセル', exact: true }).click();
    await page.evaluate(() => { window.saveGame = window.savedMyBookSave; });
    await noteButton(page, 'quux-study').click();
    await expect(page.locator('#myWordbookNoteMeaning')).toHaveValue('元の自分の訳');
});

test('マイ単語帳：統合カードへの長いメモも320pxで入力・保存・表示・閉じるができる', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 320, height: 740 });
    await create(page);
    const word = await page.evaluate(() => [...MyWordbooks.getCatalog().byKey.values()].find(item => item.word.senses?.length > 1).word.word);
    await add(page, word);
    await page.getByRole('button', { name: '登録した単語', exact: true }).click();
    await noteButton(page, word).click();
    const meaning = '自分の訳 ⇔\n' + '長い訳'.repeat(160);
    const memo = '<b>覚え方</b>\n' + '長いメモ'.repeat(110);
    await page.locator('#myWordbookNoteMeaning').fill(meaning);
    await page.locator('#myWordbookNoteMemo').fill(memo);
    await page.screenshot({ path: `screenshots/my-wordbook-note-editor-${testInfo.project.name}.png` });
    await page.getByRole('button', { name: 'メモを保存', exact: true }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.keyboard.press('Escape');
    await expect(page.locator('#myWordbookModal')).toBeHidden();
    await open(page);
    await page.locator('#myWordbookLibraryList button').click();
    await page.locator('#myWordbookStart').click();
    await page.locator('#meaningCard').click();
    await expect(page.locator('.my-original-meaning .merged-sense')).not.toHaveCount(0);
    await expect(page.locator('.my-study-note')).toContainText(meaning);
    await expect(page.locator('.my-study-note b')).toHaveCount(0);
    await expect(page.locator('.my-noted-meaning')).toHaveCSS('overflow-y', 'auto');
    expect(await page.locator('.my-noted-meaning').evaluate(el => el.scrollHeight > el.clientHeight)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.locator('.my-noted-meaning').evaluate(el => el.scrollTop = el.scrollHeight);
    await page.screenshot({ path: `screenshots/my-wordbook-note-long-${testInfo.project.name}.png` });
});

test('マイ単語帳：期限切れは開いていた意味編集・メモ保存も止め内容を保持', async ({ page }) => {
    await create(page);
    await addCustom(page, 'quux-study', '名', '期限切れでも元の意味');
    await page.getByRole('button', { name: '登録した単語', exact: true }).click();
    await saveNote(page, 'quux-study', '期限切れでも自分の訳');
    const before = await page.evaluate(() => JSON.stringify({ books: gameState.myWordbooks, words: gameState.myCustomWords }));
    const key = await page.evaluate(() => gameState.myWordbooks[0].wordKeys[0]);
    await noteButton(page, 'quux-study').click();
    await page.locator('#myWordbookNoteMeaning').fill('保存しない訳');
    await page.evaluate(key => {
        localStorage.setItem('vocabGame_expiry', String(Date.now() - 1000));
        MyWordbooks.saveNote({ preventDefault() {} });
        MyWordbooks.editCustom(key);
        MyWordbooks.addCustom({ preventDefault() {} });
        updateTrialTimer();
    }, key);
    expect(await page.evaluate(() => JSON.stringify({ books: gameState.myWordbooks, words: gameState.myCustomWords }))).toBe(before);
    await expect(page.locator('#myWordbookModal')).toBeHidden();
    await page.reload();
    expect(await page.evaluate(() => JSON.stringify({ books: gameState.myWordbooks, words: gameState.myCustomWords }))).toBe(before);
});
