const { test, expect } = require('@playwright/test');

function isIgnorableConsoleError(text) {
  // 必要最小限の除外（環境依存ノイズのみ）
  const ignorePatterns = [
    /favicon\.ico/i,
    /ERR_BLOCKED_BY_CLIENT/i,
  ];
  return ignorePatterns.some((re) => re.test(text));
}

test('トップ画面が表示される', async ({ page }) => {
  await page.goto('/index.html');
  await expect(page.locator('#vocabCard')).toBeVisible();
  await expect(page.locator('#meaningCard')).toBeVisible();
});

test('意味カードをクリックすると反転する', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('vocabGame_skipWelcome', 'true');
  });

  // SW/リダイレクト揺れを減らすため、実ページへ直接アクセス
  await page.goto('/vocab_clicker_game.html', { waitUntil: 'domcontentloaded' });

  // 初期化完了待ち（未初期化文言が消えるまで）
  await expect(page.locator('#vocabWord')).not.toContainText('ファイルを読み込んでください');

  const meaningCard = page.locator('#meaningCard');
  await expect(meaningCard).toBeVisible();
  await expect(meaningCard).not.toHaveClass(/flipped/);

  await meaningCard.click({ force: true });
  await expect(meaningCard).toHaveClass(/flipped/);
});

test('モード切替ボタンが動作する', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('vocabGame_skipWelcome', 'true');
  });

  await page.goto('/vocab_clicker_game.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#vocabWord')).not.toContainText('ファイルを読み込んでください');

  const modes = ['unlearned', 'weak', 'learned', 'perfect'];

  for (const mode of modes) {
    const btn = page.locator(`.mode-btn[data-mode="${mode}"]`).first();
    await expect(btn).toBeVisible();
    await btn.click({ force: true });
    await expect(btn).toHaveClass(/active/);
  }
});

test('プロフィールモーダルを開閉できる', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('vocabGame_skipWelcome', 'true');
  });

  await page.goto('/vocab_clicker_game.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#vocabWord')).not.toContainText('ファイルを読み込んでください');

  const modal = page.locator('#profileModal');
  await expect(modal).toBeHidden();

  // 開く
  await page.evaluate(() => {
    if (typeof window.openProfileModal === 'function') window.openProfileModal();
  });
  await expect(modal).toBeVisible();

  // 閉じる（リロードなどで実行コンテキストが切れてもリトライ）
  await expect.poll(async () => {
    try {
      await page.evaluate(() => {
        if (typeof window.closeProfileModal === 'function') window.closeProfileModal();
      });
    } catch (_) {
      // context destroyed はリトライで吸収
    }
    return await modal.evaluate((el) => getComputedStyle(el).display === 'none');
  }, { timeout: 5000 }).toBe(true);
});

test('復習モード切替が ON→MIX→OFF で循環する', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('vocabGame_skipWelcome', 'true');
  });

  await page.goto('/vocab_clicker_game.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#vocabWord')).not.toContainText('ファイルを読み込んでください');

  await page.evaluate(() => {
    if (typeof window.openStudyModeModal === 'function') window.openStudyModeModal();
  });

  const label = page.locator('#dueOnlyModeLabelModal');
  const toggleBtn = page.getByRole('button', { name: '🧹 配信モード切替' });

  await expect(label).toContainText('MIX');
  await toggleBtn.click();
  await expect(label).toContainText('ON');
  await toggleBtn.click();
  await expect(label).toContainText('OFF');
  await toggleBtn.click();
  await expect(label).toContainText('MIX');
});

test('復習キュー右上ラベルのタップで復習モードを切り替えられる', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('vocabGame_skipWelcome', 'true');
  });

  await page.goto('/vocab_clicker_game.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#vocabWord')).not.toContainText('ファイルを読み込んでください');

  await page.evaluate(() => {
    const gs = window.gameState;
    if (!gs || !gs.currentWord) return;
    const key = (window.getWordKeySafe ? window.getWordKeySafe(gs.currentWord, gs.currentWord.__sourceLevel || gs.currentLevel) : null);
    if (!key) return;
    gs.wordStates[key] = 'weak';
    gs.srsData = gs.srsData || {};
    gs.srsData[key] = { ...(gs.srsData[key] || {}), dueAt: Date.now() - 1000 };
    if (typeof window.updateReviewProgressUI === 'function') window.updateReviewProgressUI();
  });

  const inlineLabel = page.locator('#reviewModeInlineLabel');
  await expect(page.locator('#reviewProgressWrap')).toBeVisible();
  await expect(inlineLabel).toContainText('MIX');
  await inlineLabel.click();
  await expect(inlineLabel).toContainText('ON');
  await inlineLabel.click();
  await expect(inlineLabel).toContainText('OFF');
  await inlineLabel.click();
  await expect(inlineLabel).toContainText('MIX');
});

test('復習モードONでは新規のみの遷移にならない（復習優先）', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('vocabGame_skipWelcome', 'true');
  });

  await page.goto('/vocab_clicker_game.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#vocabWord')).not.toContainText('ファイルを読み込んでください');

  // Ensure there is at least one review candidate
  await page.evaluate(() => {
    const gs = window.gameState;
    if (!gs || !gs.currentWord) return;
    const w = gs.currentWord;
    const key = (window.getWordKeySafe ? window.getWordKeySafe(w, w.__sourceLevel || gs.currentLevel) : null);
    if (!key) return;
    gs.wordStates[key] = 'weak';
    if (!gs.srsData) gs.srsData = {};
    if (!gs.srsData[key]) gs.srsData[key] = {};
    gs.srsData[key].dueAt = Date.now() - 1000;
  });

  await page.evaluate(() => {
    if (typeof window.openStudyModeModal === 'function') window.openStudyModeModal();
  });

  const label = page.locator('#dueOnlyModeLabelModal');
  const toggleBtn = page.getByRole('button', { name: '🧹 配信モード切替' });

  // Move to ON
  while (!(await label.textContent()).includes('ON')) {
    await toggleBtn.click();
  }

  await page.locator('#vocabCard').click({ force: true });
  await expect(page.locator('#vocabCard .review-badge')).toBeVisible();
});

test('復習モードOFFでは新規が出題される', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('vocabGame_skipWelcome', 'true');
  });

  await page.goto('/vocab_clicker_game.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#vocabWord')).not.toContainText('ファイルを読み込んでください');

  await page.evaluate(() => {
    if (typeof window.openStudyModeModal === 'function') window.openStudyModeModal();
  });

  const label = page.locator('#dueOnlyModeLabelModal');
  const toggleBtn = page.getByRole('button', { name: '🧹 配信モード切替' });

  // Move to OFF
  while (!(await label.textContent()).includes('OFF')) {
    await toggleBtn.click();
  }

  // In OFF, should behave as new-first (badge absent on first tap flow)
  await page.locator('#vocabCard').click({ force: true });
  await expect(page.locator('#vocabCard .review-badge')).toHaveCount(0);
});

test('正答率閾値(80/50)で状態分類される', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('vocabGame_skipWelcome', 'true');
  });

  await page.goto('/vocab_clicker_game.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#vocabWord')).not.toContainText('ファイルを読み込んでください');

  const result = await page.evaluate(() => {
    if (!window.gameState || typeof window.deriveStateFromAccuracy !== 'function') return null;
    window.gameState.srsData = window.gameState.srsData || {};
    window.gameState.wordStates = window.gameState.wordStates || {};

    window.gameState.srsData.k1 = { successCount: 8, failCount: 2 };
    window.gameState.srsData.k2 = { successCount: 5, failCount: 5 };
    window.gameState.srsData.k3 = { successCount: 4, failCount: 6 };
    window.gameState.wordStates.k1 = 'weak';
    window.gameState.wordStates.k2 = 'weak';
    window.gameState.wordStates.k3 = 'learned';

    return {
      k1: window.deriveStateFromAccuracy('k1'),
      k2: window.deriveStateFromAccuracy('k2'),
      k3: window.deriveStateFromAccuracy('k3'),
    };
  });

  expect(result).toEqual({ k1: 'perfect', k2: 'learned', k3: 'weak' });
});

test('致命的な console error / page error が出ない', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('vocabGame_skipWelcome', 'true');
  });

  const consoleErrors = [];
  const pageErrors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!isIgnorableConsoleError(text)) consoleErrors.push(text);
    }
  });

  page.on('pageerror', (err) => {
    pageErrors.push(String(err));
  });

  await page.goto('/vocab_clicker_game.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#vocabWord')).not.toContainText('ファイルを読み込んでください');

  // 主要操作を軽く実行して、実運用に近いエラーを拾う
  await page.locator('#meaningCard').click({ force: true });
  await page.locator('.mode-btn[data-mode="weak"]').first().click({ force: true });
  await page.evaluate(() => {
    if (typeof window.openProfileModal === 'function') window.openProfileModal();
    if (typeof window.closeProfileModal === 'function') window.closeProfileModal();
  });

  expect.soft(consoleErrors, `Console errors:\n${consoleErrors.join('\n')}`).toEqual([]);
  expect(pageErrors, `Page errors:\n${pageErrors.join('\n')}`).toEqual([]);
});

test('manual weak mode ignores review queue level filters', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('vocabGame_skipWelcome', 'true');
  });

  await page.goto('/vocab_clicker_game.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#vocabWord')).not.toContainText('繝輔ぃ繧､繝ｫ繧定ｪｭ縺ｿ霎ｼ繧薙〒縺上□縺輔＞');

  const targetWord = await page.evaluate(() => {
    const gs = window.gameState;
    if (!gs || !window.vocabulary || window.vocabulary.length === 0) return null;

    for (const word of window.vocabulary) {
      const key = window.getWordKey(word, gs.currentLevel);
      gs.wordStates[key] = 'unlearned';
      if (gs.srsData && gs.srsData[key]) {
        gs.srsData[key].dueAt = Date.now() + 86400000;
      }
    }

    const target = window.vocabulary[0];
    const targetKey = window.getWordKey(target, gs.currentLevel);
    gs.wordStates[targetKey] = 'weak';
    gs.activeReviewLevels = ['daily'];
    gs.decks = null;
    gs.srsData = gs.srsData || {};
    gs.srsData[targetKey] = { ...(gs.srsData[targetKey] || {}), dueAt: Date.now() - 1000 };

    if (typeof window.updateWordStats === 'function') window.updateWordStats();
    if (typeof window.updateModeButtons === 'function') window.updateModeButtons();

    return target.word;
  });

  expect(targetWord).not.toBeNull();

  const weakBtn = page.locator('.mode-btn[data-mode="weak"]').first();
  await weakBtn.click({ force: true });
  await expect(weakBtn).toHaveClass(/active/);
  await expect(page.locator('#vocabWord')).toContainText(targetWord);
});
