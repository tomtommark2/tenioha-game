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
