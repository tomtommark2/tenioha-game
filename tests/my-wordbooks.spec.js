const { test, expect } = require('@playwright/test');
const errors = new WeakMap();

test.beforeEach(async ({ page, baseURL }) => {
    errors.set(page, []);
    page.on('pageerror', error => errors.get(page).push(error.message));
    const origin = new URL(baseURL).origin;
    await page.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
    await page.addInitScript(() => {
        localStorage.setItem('vocabGame_skipWelcome', 'true');
        localStorage.setItem('vocabGame_disableAutoUpdate', 'true');
        localStorage.setItem('vocabGame_installGuideDismissed', 'true');
        localStorage.setItem('vocabGame_lastAutoShownAnnouncementId', '2026-10-04-noun-illustrations-complete');
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
    await page.getByRole('button', { name: '単語・意味を入力して追加', exact: true }).click();
    await page.locator('#myWordbookCustomWord').fill(word);
    if (await page.locator('#myWordbookCustomPos').isEnabled()) await page.locator('#myWordbookCustomPos').selectOption(pos);
    await page.locator('#myWordbookCustomMeaning').fill(meaning);
    await page.locator('#myWordbookCustomSave').click();
}

async function enablePremium(page) {
    await page.evaluate(() => {
        localStorage.setItem('vocabGame_isUnlocked', 'true');
        localStorage.setItem('vocabGame_expiry', String(Date.now() + 86400000));
        updateTrialTimer();
    });
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

test('マイ単語帳：品詞・キュー範囲を維持し登録でSRSを増やさず期限切れでも継続', async ({ page }) => {
    await enablePremium(page);
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
    expect(await page.evaluate(() => gameState.currentLevel)).toBe('my');
    expect(await page.evaluate(() => gameState.currentMode)).toBe('all');
    expect(await page.evaluate(() => buildReviewQueueSnapshot().stats.dueNow)).toBe(2);
    const before = await page.evaluate(() => gameState.globalQuestionCount);
    await page.evaluate(() => MyWordbooks.practiceAll());
    expect(await page.evaluate(() => gameState.globalQuestionCount)).toBeGreaterThan(before);
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
    await addCustom(page, item.word, item.senses[0].pos, '授業で使う訳');
    expect(await page.evaluate(() => gameState.myWordbooks[0].wordKeys)).toEqual([item.key]);
    expect(await page.evaluate(key => gameState.myWordbooks[0].wordNotes[key]?.meaning, item.key)).toBe('授業で使う訳');
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

test('マイ単語帳：収録語の訳と追加を一括保存し失敗時は入力・履歴・元の意味を保つ', async ({ page }) => {
    await create(page);
    await page.locator('#myWordbookInput').fill('apple\nschool');
    await page.getByRole('button', { name: '照合する', exact: true }).click();
    await expect(page.locator('#myWordbookSelectionCount')).toHaveText('2語選択');
    const before = await page.evaluate(() => JSON.stringify({ books: gameState.myWordbooks, words: gameState.myCustomWords,
        history: gameState.srsData, score: gameState.reviewScore, database: vocabularyDatabase.junior }));
    await page.evaluate(() => { window.savedMyBookSave = window.saveGame; window.saveGame = () => false; });
    await addCustom(page, 'apple', '名', 'おりんご');
    await expect(page.locator('#myWordbookStatus')).toContainText('保存できませんでした');
    await expect(page.locator('#myWordbookCustomMeaning')).toHaveValue('おりんご');
    await expect(page.locator('#myWordbookEditorContent')).toBeHidden();
    expect(await page.evaluate(() => JSON.stringify({ books: gameState.myWordbooks, words: gameState.myCustomWords,
        history: gameState.srsData, score: gameState.reviewScore, database: vocabularyDatabase.junior }))).toBe(before);
    await page.evaluate(() => { window.saveGame = window.savedMyBookSave; });
    await page.locator('#myWordbookCustomSave').click();
    await expect(page.locator('#myWordbookStatus')).toContainText('自分の訳付きで追加');
    await expect(page.locator('#myWordbookSelectionCount')).toHaveText('1語選択');
    await expect(checkbox(page, 'apple')).toBeDisabled();
    await expect(checkbox(page, 'school')).toBeChecked();
    expect(await page.evaluate(() => gameState.myCustomWords.length)).toBe(0);
    const books = await page.evaluate(() => gameState.myWordbooks);
    await page.evaluate(() => { window.savedMyBookSave = window.saveGame; window.saveGame = () => false; });
    await addCustom(page, 'quux-study', '名', '保存失敗のテスト');
    await expect(page.locator('#myWordbookStatus')).toContainText('保存できませんでした');
    expect(await page.evaluate(() => gameState.myCustomWords.length)).toBe(0);
    expect(await page.evaluate(() => gameState.myWordbooks)).toEqual(books);
    await page.evaluate(() => { window.saveGame = window.savedMyBookSave; });
});

test('マイ単語帳：登録は専用画面へ切り替え320pxでも入力を見せ戻る・キャンセルを保持', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 320, height: 740 });
    await create(page);
    await page.locator('#myWordbookInput').fill('apple\nquux-study');
    await page.getByRole('button', { name: '照合する', exact: true }).click();
    await expect(page.locator('#myWordbookSelectionCount')).toHaveText('1語選択');
    const opener = page.getByRole('button', { name: '単語・意味を入力して追加', exact: true });
    await opener.click();
    await expect(page.locator('#myWordbookWordEditor')).toBeVisible();
    await expect(page.locator('#myWordbookEditorContent')).toBeHidden();
    await expect(page.locator('#myWordbookCustomWord')).toBeFocused();
    for (const id of ['myWordbookCustomWord', 'myWordbookCustomMeaning']) {
        expect(await page.locator(`#${id}`).evaluate(el => {
            const box = el.getBoundingClientRect();
            return box.top >= 0 && box.bottom <= innerHeight && box.left >= 0 && box.right <= innerWidth;
        })).toBe(true);
    }
    await page.locator('#myWordbookCustomWord').fill('quux-study');
    await page.locator('#myWordbookCustomMeaning').fill('未保存の意味');
    await page.screenshot({ path: `screenshots/my-wordbook-registration-custom-${testInfo.project.name}.png` });
    await page.getByRole('button', { name: '‹ 戻る', exact: true }).click();
    await expect(opener).toBeFocused();
    await expect(page.locator('#myWordbookCustomForm')).toBeHidden();
    await expect(page.locator('#myWordbookInput')).toHaveValue('apple\nquux-study');
    await expect(page.locator('#myWordbookSelectionCount')).toHaveText('1語選択');
    expect(await page.evaluate(() => gameState.myCustomWords)).toEqual([]);
    await page.getByRole('button', { name: 'quux-study の意味を入力', exact: true }).click();
    await expect(page.locator('#myWordbookCustomMeaning')).toBeFocused();
    await expect(page.locator('#myWordbookCustomWord')).toHaveValue('quux-study');
    await page.getByRole('button', { name: 'キャンセル', exact: true }).click();
    await expect(page.locator('#myWordbookEditorHeading')).toBeFocused();
    await opener.click();
    await page.keyboard.press('Escape');
    await expect(page.locator('#myWordbookModal')).toBeHidden();
    await open(page);
    await page.locator('#myWordbookLibraryList button').click();
    await expect(page.locator('#myWordbookWordEditor')).toBeHidden();
});

test('マイ単語帳：収録済み語を自分の訳で登録し原本・同じキー・復習・Undo・復元を維持', async ({ page }, testInfo) => {
    test.setTimeout(60000);
    await create(page, '教材A');
    const original = await page.evaluate(() => {
        const item = MyWordbooks.getRegistrationMatches('apple')[0];
        gameState.wordStates[item.key] = 'weak';
        Object.assign(ensureSrsEntry(item.key), { recentAnswers: [false], everWrong: true, firstTryPerfect: false, dueAt: Date.now() - 1000 });
        return { key: item.key, database: JSON.stringify(vocabularyDatabase.junior), history: JSON.stringify(gameState.srsData),
            score: JSON.stringify(gameState.reviewScore), count: gameState.globalQuestionCount };
    });
    await addCustom(page, 'ＡＰＰＬＥ', '名', 'おりんご');
    expect(await page.evaluate(() => gameState.myWordbooks[0].wordKeys)).toEqual([original.key]);
    expect(await page.evaluate(() => gameState.myCustomWords)).toEqual([]);
    expect(await page.evaluate(() => JSON.stringify(gameState.srsData))).toBe(original.history);
    expect(await page.evaluate(() => JSON.stringify(gameState.reviewScore))).toBe(original.score);
    expect(await page.evaluate(() => gameState.globalQuestionCount)).toBe(original.count);
    await page.getByRole('button', { name: '登録した単語', exact: true }).click();
    await saveNote(page, 'apple', 'おりんご', '残す覚え方');
    await page.locator('#myWordbookStart').click();
    expect(await page.evaluate(() => getWordKeySafe(gameState.currentWord))).toBe(original.key);
    await page.locator('#meaningCard').click();
    await expect(page.locator('.my-original-meaning')).toContainText('リンゴ');
    await expect(page.locator('.my-study-note')).toContainText('おりんご');
    const answered = await page.evaluate(() => JSON.stringify({ srs: gameState.srsData, score: gameState.reviewScore,
        count: gameState.globalQuestionCount, word: getWordKeySafe(gameState.currentWord), undo: gameStateHistory }));
    await page.locator('#myWordbookStudyBar').getByRole('button', { name: '編集', exact: true }).click();
    await page.getByRole('button', { name: '入力して追加', exact: true }).click();
    await page.getByRole('button', { name: '単語・意味を入力して追加', exact: true }).click();
    await page.locator('#myWordbookCustomWord').fill('APPLE');
    await expect(page.locator('#myWordbookCustomPosLabel')).toBeHidden();
    await expect(page.locator('#myWordbookRegistrationCandidates input')).toBeChecked();
    await expect(page.locator('#myWordbookCustomSave')).toHaveText('自分の訳を保存');
    await page.locator('#myWordbookCustomMeaning').fill('おりんご');
    await page.screenshot({ path: `screenshots/my-wordbook-registration-known-${testInfo.project.name}.png` });
    await page.locator('#myWordbookCustomMeaning').fill('<b>教材Aの訳</b>');
    await page.locator('#myWordbookCustomSave').click();
    expect(await page.evaluate(() => JSON.stringify({ srs: gameState.srsData, score: gameState.reviewScore,
        count: gameState.globalQuestionCount, word: getWordKeySafe(gameState.currentWord), undo: gameStateHistory }))).toBe(answered);
    expect(await page.evaluate(key => gameState.myWordbooks[0].wordNotes[key], original.key)).toEqual({ meaning: '<b>教材Aの訳</b>', memo: '残す覚え方' });
    expect(await page.evaluate(() => gameState.myWordbooks[0].wordKeys)).toEqual([original.key]);
    await page.getByRole('button', { name: 'マイ単語帳を閉じる', exact: true }).click();
    await page.locator('#undoBtn').click();
    await expect(page.locator('.my-study-note')).toContainText('<b>教材Aの訳</b>');
    await expect(page.locator('.my-study-note b')).toHaveCount(0);
    expect(await page.evaluate(() => JSON.stringify(vocabularyDatabase.junior))).toBe(original.database);
    await page.locator('#myWordbookStudyBar').getByRole('button', { name: '編集', exact: true }).click();
    await page.getByRole('button', { name: '‹ 単語帳一覧', exact: true }).click();
    await page.locator('#myWordbookNewName').fill('教材B');
    await page.locator('#myWordbookCreateForm button').click();
    await addCustom(page, 'apple', '名', '教材Bの訳');
    await page.reload();
    expect(await page.evaluate(key => gameState.myWordbooks.map(book => ({ keys: book.wordKeys, meaning: book.wordNotes[key]?.meaning })), original.key))
        .toEqual([{ keys: [original.key], meaning: '<b>教材Aの訳</b>' }, { keys: [original.key], meaning: '教材Bの訳' }]);
    expect(await page.evaluate(() => gameState.myCustomWords)).toEqual([]);
});

test('マイ単語帳：収録済みの同綴り別カードは未選択で示し品詞・意味を確認して一語だけ登録', async ({ page }) => {
    await create(page);
    const keys = await page.evaluate(() => {
        const word = 'quux-homograph';
        window.vocabularyDatabase = { ...window.vocabularyDatabase, junior: [
            ...vocabularyDatabase.junior, { word, pos: '名', meaning: '物の名前', set: 1 }, { word, pos: '動', meaning: '動作する', set: 1 },
        ] };
        return MyWordbooks.getRegistrationMatches(word).map(item => item.key);
    });
    await addCustom(page, 'quux-homograph', '名', '自分の意味');
    await expect(page.locator('#myWordbookRegistrationCandidates input:checked')).toHaveCount(0);
    await expect(page.locator('#myWordbookRegistrationCandidates')).toContainText('名詞：物の名前');
    await expect(page.locator('#myWordbookRegistrationCandidates')).toContainText('動詞：動作する');
    await expect(page.locator('#myWordbookStatus')).toContainText('元のカードを選んで');
    expect(await page.evaluate(() => gameState.myWordbooks[0].wordKeys)).toEqual([]);
    await page.locator('#myWordbookRegistrationCandidates input').nth(1).check();
    await page.locator('#myWordbookCustomSave').click();
    expect(await page.evaluate(() => gameState.myWordbooks[0].wordKeys)).toEqual([keys[1]]);
    expect(await page.evaluate(key => gameState.myWordbooks[0].wordNotes[key]?.meaning, keys[1])).toBe('自分の意味');
    expect(await page.evaluate(() => gameState.myCustomWords)).toEqual([]);
});

test('マイ単語帳：無料で作成でき、期限切れ後も編集・学習・復元を継続', async ({ page }) => {
    expect(await page.evaluate(() => GameUtils.checkPremiumStatus())).toBe(false);
    await create(page);
    await expect(page.locator('#myWordbookPremiumBadge')).toHaveText('無料');
    await expect(page.locator('#myWordbookIntro')).not.toContainText('プレミアム');
    await expect(page.locator('#profileModal')).toBeHidden();
    await addCustom(page, 'quux-study', '名', '期限切れでも保持');
    await enablePremium(page);
    await page.locator('#myWordbookStart').click();
    const saved = await page.evaluate(() => ({ books: gameState.myWordbooks, words: gameState.myCustomWords }));
    await page.evaluate(() => {
        localStorage.setItem('vocabGame_expiry', String(Date.now() - 1000));
        updateTrialTimer();
    });
    expect(await page.evaluate(() => gameState.currentLevel)).toBe('my');
    expect(await page.evaluate(() => gameState.currentMode)).toBe('all');
    await page.reload();
    expect(await page.evaluate(() => ({ books: gameState.myWordbooks, words: gameState.myCustomWords }))).toEqual(saved);
    expect(await page.evaluate(() => gameState.currentLevel)).toBe('my');
    expect(await page.evaluate(() => gameState.currentMode)).toBe('all');
    expect(await page.evaluate(() => GameUtils.checkPremiumStatus())).toBe(false);
    await open(page);
    await page.locator('#myWordbookLibraryList button').click();
    await page.getByRole('button', { name: 'quux-study（名詞）の意味を編集', exact: true }).click();
    await page.locator('#myWordbookCustomMeaning').fill('無料でも修正できる');
    await page.locator('#myWordbookCustomSave').click();
    await page.locator('#myWordbookStart').click();
    await expect(page.locator('#vocabWord')).toContainText('quux-study');
    await expect(page.locator('#meaningText')).toContainText('無料でも修正できる');
    await expect(page.locator('#profileModal')).toBeHidden();
    await expect(page.locator('#purchaseModal')).toBeHidden();
});

test('マイ単語帳：無料でも利用権を付与せず1日8分・イラスト100語を維持', async ({ page }) => {
    await create(page);
    await addCustom(page, 'quux-study', '名', '無料で登録');
    await page.locator('#myWordbookStart').click();
    const result = await page.evaluate(() => {
        window.isTrialLimitDisabledForLocalDevelopment = () => false;
        trialState.playTimeSeconds = TRIAL_CONFIG.LIMIT_SECONDS;
        trialState.lastPlayDate = getTrialDateKey();
        const before = JSON.stringify([gameState.srsData, gameState.reviewScore, gameState.globalQuestionCount]);
        const allowed = ensureTrialAccess();
        MyWordbooks.practiceAll();
        return { allowed, before, after: JSON.stringify([gameState.srsData, gameState.reviewScore, gameState.globalQuestionCount]),
            premium: GameUtils.checkPremiumStatus(), unlocked: trialState.unlocked, limit: TRIAL_CONFIG.LIMIT_SECONDS,
            illustrated: WordIllustrations.accessibleWords('illustrated', vocabularyDatabase).length };
    });
    expect(result).toMatchObject({ allowed: false, premium: false, unlocked: false, limit: 480, illustrated: 100 });
    expect(result.after).toBe(result.before);
    await expect(page.locator('#trialOverlay')).toBeVisible();
    expect(await page.evaluate(() => {
        trialState.lastPlayDate = '2020-01-01';
        resetTrialDayIfNeeded();
        return { seconds: trialState.playTimeSeconds, allowed: ensureTrialAccess(), level: gameState.currentLevel };
    })).toEqual({ seconds: 0, allowed: true, level: 'my' });
});

test('マイ単語帳：自作語の文字サイズ・配置を収録語と揃え、Undoでも保持', async ({ page }, testInfo) => {
    await create(page);
    await addCustom(page, 'quux', '名', '本人の訳');
    await page.locator('#myWordbookStart').click();
    for (const width of [320, testInfo.project.use.viewport?.width || 1280]) {
        await page.setViewportSize({ width, height: 844 });
        const styles = await page.evaluate(() => {
            const custom = gameState.currentWord;
            const typography = () => Object.fromEntries(['.word-pos-label', '.word-text-main', '.word-meaning-main'].map(selector => {
                const style = getComputedStyle(document.querySelector(selector));
                return [selector, Object.fromEntries(['fontSize', 'fontWeight', 'color', 'textAlign', 'lineHeight', 'marginBottom'].map(property => [property, style[property]]))];
            }));
            showWord(MyWordbooks.getRegistrationMatches('apple')[0].word);
            const reference = typography();
            showWord(custom);
            return { reference, custom: typography() };
        });
        expect(styles.custom).toEqual(styles.reference);
        expect(styles.custom['.word-text-main'].fontSize).toBe('42px');
        expect(styles.custom['.word-meaning-main'].fontSize).toBe('32px');
        expect(await page.locator('.my-custom-meaning').evaluate(element => {
            const bounds = element.getBoundingClientRect(), card = element.closest('.card').getBoundingClientRect();
            return Math.abs((bounds.left + bounds.right) / 2 - (card.left + card.right) / 2) < 1;
        })).toBe(true);
    }
    await page.locator('#meaningCard').click();
    await page.screenshot({ path: `screenshots/my-wordbook-custom-aligned-${testInfo.project.name}.png` });
    await page.locator('#undoBtn').click();
    await expect(page.locator('.word-text-main')).toHaveCSS('font-size', '42px');
    await expect(page.locator('.my-custom-meaning')).toHaveCSS('font-size', '32px');
    await page.locator('#myWordbookStudyBar').getByRole('button', { name: '編集', exact: true }).click();
    await page.getByRole('button', { name: '登録した単語', exact: true }).click();
    await saveNote(page, 'quux', 'この教材の訳');
    await page.getByRole('button', { name: 'マイ単語帳を閉じる', exact: true }).click();
    await expect(page.locator('.my-original-meaning .word-meaning-main')).toHaveCSS('font-size', '22px');
    await expect(page.locator('.my-original-meaning .word-meaning-main')).toHaveCSS('text-align', 'center');
    await expect(page.locator('.my-study-note')).toContainText('この教材の訳');
    await page.locator('#myWordbookStudyBar').getByRole('button', { name: '通常の学習へ', exact: true }).click();
    await expect(page.locator('#cardsArea')).not.toHaveClass(/has-custom-word/);
    await expect(page.locator('.my-custom-meaning')).toHaveCount(0);
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
    await expect(page.locator('.word-text-main')).toHaveCSS('font-size', '42px');
    expect(await page.locator('.word-text-main').evaluate(element => element.scrollHeight > element.clientHeight && element.clientHeight <= 180)).toBe(true);
    await page.locator('.word-text-main').evaluate(element => { element.scrollTop = element.scrollHeight; });
    expect(await page.locator('.word-text-main').evaluate(element => element.scrollTop > 0)).toBe(true);
    await page.locator('#meaningCard').click();
    await expect(page.locator('.my-custom-meaning')).toHaveText(meaning);
    await expect(page.locator('.my-custom-meaning')).toHaveCSS('overflow-y', 'auto');
    await expect(page.locator('.my-custom-meaning')).toHaveCSS('font-size', '32px');
    expect(await page.locator('.my-custom-meaning').evaluate(element => element.scrollHeight > element.clientHeight && element.clientHeight <= 220)).toBe(true);
    await page.locator('.my-custom-meaning').evaluate(element => { element.scrollTop = element.scrollHeight; });
    expect(await page.locator('.my-custom-meaning').evaluate(element => element.scrollTop > 0)).toBe(true);
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
    await expect(page.locator('.my-original-meaning .word-meaning-main')).toHaveCSS('font-size', '22px');
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

test('マイ単語帳：期限切れでも開いていた意味編集・メモ保存を続け履歴を保持', async ({ page }) => {
    await enablePremium(page);
    await create(page);
    await addCustom(page, 'quux-study', '名', '期限切れでも元の意味');
    await page.getByRole('button', { name: '登録した単語', exact: true }).click();
    await saveNote(page, 'quux-study', '期限切れでも自分の訳');
    const before = await page.evaluate(() => JSON.stringify({ keys: gameState.myWordbooks[0].wordKeys,
        srs: gameState.srsData, score: gameState.reviewScore, count: gameState.globalQuestionCount }));
    await noteButton(page, 'quux-study').click();
    await page.locator('#myWordbookNoteMeaning').fill('期限切れ後の訳');
    await page.evaluate(() => {
        localStorage.setItem('vocabGame_expiry', String(Date.now() - 1000));
        updateTrialTimer();
    });
    await expect(page.locator('#myWordbookNoteForm')).toBeVisible();
    await page.getByRole('button', { name: 'メモを保存', exact: true }).click();
    await page.getByRole('button', { name: 'quux-study（名詞）の意味を編集', exact: true }).click();
    await page.locator('#myWordbookCustomMeaning').fill('期限切れ後の意味');
    await page.locator('#myWordbookCustomSave').click();
    await expect(page.locator('#myWordbookModal')).toBeVisible();
    expect(await page.evaluate(() => JSON.stringify({ keys: gameState.myWordbooks[0].wordKeys,
        srs: gameState.srsData, score: gameState.reviewScore, count: gameState.globalQuestionCount }))).toBe(before);
    await page.reload();
    expect(await page.evaluate(() => gameState.myCustomWords[0].meaning)).toBe('期限切れ後の意味');
    expect(await page.evaluate(() => Object.values(gameState.myWordbooks[0].wordNotes)[0].meaning)).toBe('期限切れ後の訳');
    expect(await page.evaluate(() => GameUtils.checkPremiumStatus())).toBe(false);
});

async function importTable(page, text) {
    await page.locator('#myWordbookImportFormat').selectOption('table');
    await page.locator('#myWordbookInput').fill(text);
    await page.getByRole('button', { name: '照合する', exact: true }).click();
}

test('マイ単語帳：一括表入力は収録語を先に追加し残りを訳・品詞付きで登録して復元', async ({ page }, testInfo) => {
    await create(page);
    const original = await page.evaluate(() => {
        const word = MyWordbooks.getRegistrationMatches('apple')[0];
        gameState.srsData[word.key] = { recentAnswers: [false], everWrong: true, dueAt: 123, reviewStep: 1 };
        return { key: word.key, meaning: word.word.meaning, srs: JSON.stringify(gameState.srsData), score: JSON.stringify(gameState.reviewScore) };
    });
    await importTable(page, 'word,meaning,pos\napple,授業のりんご,名詞\nquux-import,"独自の訳,果物",noun\nschool,授業の学校,n.\nflorp-import,独自の動作,動詞');
    await expect(page.locator('#myWordbookImportHeader')).toBeChecked();
    await expect(page.locator('#myWordbookRows')).toContainText('自分の訳：授業のりんご');
    await page.locator('#myWordbookApply').click();
    expect(await page.evaluate(() => gameState.myCustomWords)).toEqual([]);
    await expect(page.locator('#myWordbookBulkOpen')).toHaveText('未収録の2語をまとめて登録');
    await page.locator('#myWordbookBulkOpen').click();
    await expect(page.locator('#myWordbookBulkTitle')).toBeFocused();
    await expect(page.locator('#myWordbookEditorContent')).toBeHidden();
    await expect(page.getByRole('textbox', { name: '1行目の意味', exact: true })).toHaveValue('独自の訳,果物');
    await expect(page.getByRole('combobox', { name: '2行目の品詞', exact: true })).toHaveValue('動');
    await page.screenshot({ path: testInfo.outputPath('bulk-import-confirmation.png') });
    await page.locator('#myWordbookBulkSave').click();
    await expect(page.locator('#myWordbookBulkForm')).toBeHidden();
    await expect(page.locator('#myWordbookStatus')).toContainText('2語をまとめて登録');
    const saved = await page.evaluate(() => ({ books: gameState.myWordbooks, custom: gameState.myCustomWords }));
    expect(saved.books[0].wordKeys).toHaveLength(4);
    expect(saved.books[0].wordNotes[original.key].meaning).toBe('授業のりんご');
    expect(await page.evaluate(key => ({ meaning: MyWordbooks.getCatalog().byKey.get(key).word.meaning,
        srs: JSON.stringify(gameState.srsData), score: JSON.stringify(gameState.reviewScore) }), original.key)).toEqual({ meaning: original.meaning, srs: original.srs, score: original.score });
    await page.reload();
    expect(await page.evaluate(() => ({ books: gameState.myWordbooks, custom: gameState.myCustomWords }))).toEqual(saved);
});

test('マイ単語帳：一括TSVの列を確認しタグを品詞にせず未指定分だけまとめて補う', async ({ page }) => {
    await create(page);
    await importTable(page, '意味\t単語\tタグ\n独自の訳\tquux-columns\tmy-tag\n"<img src=x onerror=window.bulkInjected=1>\n複数行の訳"\tflorp-columns\tmy-tag');
    await expect(page.locator('#myWordbookImportWordColumn')).toHaveValue('1');
    await expect(page.locator('#myWordbookImportMeaningColumn')).toHaveValue('0');
    await expect(page.locator('#myWordbookImportPosColumn')).toHaveValue('-1');
    await page.locator('#myWordbookInput').fill('単語\t意味\tタグ\nquux-columns\t独自の訳\tmy-tag');
    await expect(page.locator('#myWordbookImportWordColumn')).toHaveValue('0');
    await expect(page.locator('#myWordbookImportMeaningColumn')).toHaveValue('1');
    await page.locator('#myWordbookInput').fill('意味\t単語\tタグ\n独自の訳\tquux-columns\tmy-tag\n"<img src=x onerror=window.bulkInjected=1>\n複数行の訳"\tflorp-columns\tmy-tag');
    await page.locator('#myWordbookImportWordColumn').selectOption('0');
    await expect(page.locator('#myWordbookTablePreview')).toContainText('別々の列');
    await page.locator('#myWordbookImportWordColumn').selectOption('1');
    await page.getByRole('button', { name: '照合する', exact: true }).click();
    await page.locator('#myWordbookBulkOpen').click();
    await expect(page.getByRole('combobox', { name: '1行目の品詞', exact: true })).toHaveValue('');
    await page.getByRole('combobox', { name: '2行目の品詞', exact: true }).selectOption('動');
    await page.locator('#myWordbookBulkPos').selectOption('名');
    await expect(page.getByRole('combobox', { name: '1行目の品詞', exact: true })).toHaveValue('名');
    await expect(page.getByRole('combobox', { name: '2行目の品詞', exact: true })).toHaveValue('動');
    await expect(page.locator('#myWordbookBulkRows img')).toHaveCount(0);
    expect(await page.evaluate(() => window.bulkInjected)).toBeUndefined();
    await page.locator('#myWordbookBulkSave').click();
    expect(await page.evaluate(() => gameState.myCustomWords.map(word => word.pos))).toEqual(['名', '動']);
    expect(await page.evaluate(() => gameState.myCustomWords[1].meaning)).toBe('<img src=x onerror=window.bulkInjected=1>\n複数行の訳');
});

test('マイ単語帳：一括登録の不足・保存失敗では全件を戻し入力を残して再試行', async ({ page }) => {
    await create(page);
    await importTable(page, 'quux-atomic,本人の訳,名詞\nflorp-atomic,,動詞');
    await page.locator('#myWordbookBulkOpen').click();
    const before = await page.evaluate(() => JSON.stringify([gameState.myWordbooks, gameState.myCustomWords, gameState.srsData, gameState.reviewScore]));
    await page.locator('#myWordbookBulkSave').click();
    await expect(page.locator('#myWordbookStatus')).toContainText('意味は1〜500字');
    expect(await page.evaluate(() => JSON.stringify([gameState.myWordbooks, gameState.myCustomWords, gameState.srsData, gameState.reviewScore]))).toBe(before);
    await page.getByRole('textbox', { name: '2行目の意味', exact: true }).fill('補った訳');
    await page.getByRole('textbox', { name: '1行目の単語', exact: true }).fill('apple');
    await page.locator('#myWordbookBulkSave').click();
    await expect(page.locator('#myWordbookStatus')).toContainText('元のカード');
    expect(await page.evaluate(() => JSON.stringify([gameState.myWordbooks, gameState.myCustomWords, gameState.srsData, gameState.reviewScore]))).toBe(before);
    await page.getByRole('textbox', { name: '1行目の単語', exact: true }).fill('quux-atomic');
    await page.evaluate(() => { window.bulkOriginalSave = saveGame; window.saveGame = () => false; });
    await page.locator('#myWordbookBulkSave').click();
    await expect(page.locator('#myWordbookBulkForm')).toBeVisible();
    await expect(page.locator('#myWordbookStatus')).toContainText('保存できません');
    await expect(page.getByRole('textbox', { name: '2行目の意味', exact: true })).toHaveValue('補った訳');
    expect(await page.evaluate(() => JSON.stringify([gameState.myWordbooks, gameState.myCustomWords, gameState.srsData, gameState.reviewScore]))).toBe(before);
    await page.evaluate(() => { window.saveGame = window.bulkOriginalSave; });
    await page.locator('#myWordbookBulkSave').click();
    expect(await page.evaluate(() => gameState.myCustomWords)).toHaveLength(2);
    await page.getByRole('button', { name: '照合する', exact: true }).click();
    await expect(page.locator('#myWordbookBulkOpen')).toHaveCount(0);
    await expect(page.locator('#myWordbookApply')).toBeDisabled();
});

test('マイ単語帳：一括入力の同綴り候補・自作語別品詞と矛盾した訳を確認して保存', async ({ page }) => {
    await create(page);
    const word = await page.evaluate(() => [...MyWordbooks.getCatalog().byText.values()]
        .find(items => items.length > 1 && items.every(item => item.level !== 'my-custom'))[0].word.word);
    await importTable(page, `${word},本人の訳\nquux-pos,名詞の訳\nquux-pos,動詞の訳`);
    expect(await page.locator('#myWordbookRows input:checked').count()).toBe(0);
    const candidates = page.locator('#myWordbookRows input');
    await candidates.first().check();
    await page.locator('#myWordbookApply').click();
    expect(await page.evaluate(() => gameState.myWordbooks[0].wordKeys)).toHaveLength(1);
    await page.locator('#myWordbookBulkOpen').click();
    await page.getByRole('combobox', { name: '1行目の品詞', exact: true }).selectOption('名');
    await page.getByRole('combobox', { name: '2行目の品詞', exact: true }).selectOption('名');
    await page.locator('#myWordbookBulkSave').click();
    await expect(page.locator('#myWordbookStatus')).toContainText('異なる意味');
    expect(await page.evaluate(() => gameState.myCustomWords)).toEqual([]);
    await page.getByRole('combobox', { name: '2行目の品詞', exact: true }).selectOption('動');
    await page.locator('#myWordbookBulkSave').click();
    const result = await page.evaluate(() => gameState.myCustomWords);
    expect(result.map(word => word.pos)).toEqual(['名', '動']);
    expect(new Set(result.map(word => word.id)).size).toBe(2);
});

test('マイ単語帳：一括登録は単語だけの未収録語でも使えキャンセル・戻る・320pxを保持', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 320, height: 780 });
    await create(page);
    await page.locator('#myWordbookInput').fill('apple\nquux-cancel\nflorp-cancel');
    await page.getByRole('button', { name: '照合する', exact: true }).click();
    await page.locator('#myWordbookBulkOpen').click();
    await page.getByRole('textbox', { name: '1行目の意味', exact: true }).fill('途中の訳');
    await page.getByRole('combobox', { name: '1行目の品詞', exact: true }).selectOption('名');
    const before = await page.evaluate(() => JSON.stringify([gameState.myWordbooks, gameState.myCustomWords, gameState.srsData]));
    await page.screenshot({ path: testInfo.outputPath('bulk-import-320.png') });
    expect(await page.locator('.my-wordbook-panel').evaluate(panel => panel.scrollWidth <= panel.clientWidth + 1)).toBe(true);
    await page.getByRole('button', { name: 'キャンセル', exact: true }).click();
    await expect(page.locator('#myWordbookBulkOpen')).toBeFocused();
    await expect(page.locator('#myWordbookInput')).toHaveValue('apple\nquux-cancel\nflorp-cancel');
    await expect(checkbox(page, 'apple')).toBeChecked();
    expect(await page.evaluate(() => JSON.stringify([gameState.myWordbooks, gameState.myCustomWords, gameState.srsData]))).toBe(before);
    await page.locator('#myWordbookBulkOpen').click();
    await expect(page.getByRole('textbox', { name: '1行目の意味', exact: true })).toHaveValue('途中の訳');
    await page.keyboard.press('Escape');
    await expect(page.locator('#myWordbookModal')).toBeHidden();
});

test('マイ単語帳：一括登録の61語でもページ間の編集・選択を保持し一度で保存', async ({ page }) => {
    await create(page);
    await importTable(page, Array.from({ length: 61 }, (_, i) => `quux-page-${i},訳${i},名詞`).join('\n'));
    await page.locator('#myWordbookBulkOpen').click();
    await page.getByRole('textbox', { name: '1行目の意味', exact: true }).fill('ページをまたぐ編集');
    await page.getByRole('checkbox', { name: '2行目を登録', exact: true }).uncheck();
    await page.locator('#myWordbookBulkNext').click();
    await expect(page.getByRole('textbox', { name: '61行目の意味', exact: true })).toHaveValue('訳60');
    await page.locator('#myWordbookBulkPrev').click();
    await expect(page.getByRole('textbox', { name: '1行目の意味', exact: true })).toHaveValue('ページをまたぐ編集');
    await expect(page.getByRole('checkbox', { name: '2行目を登録', exact: true })).not.toBeChecked();
    await page.locator('#myWordbookBulkSave').click();
    const words = await page.evaluate(() => gameState.myCustomWords);
    expect(words).toHaveLength(60);
    expect(words[0].meaning).toBe('ページをまたぐ編集');
    expect(words.some(word => word.word === 'quux-page-1')).toBe(false);
    expect(words.some(word => word.word === 'quux-page-60')).toBe(true);
    await expect(page.locator('#myWordbookBulkOpen')).toHaveText('未収録の1語をまとめて登録');
});
