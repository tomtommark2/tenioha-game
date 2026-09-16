const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('vocabGame_skipWelcome', 'true');
    localStorage.setItem('vocabGame_disableAutoUpdate', 'true');
  });
  await page.goto('/index.html');
  await expect(page.locator('#otherMenuBtn')).toBeVisible();
});

test('省スペース設定入口は目印を一度消すと再表示しない', async ({ page }) => {
  await expect(page.locator('#settingsMenuHint')).toBeVisible();
  await page.getByRole('button', { name: 'その他メニュー' }).click();
  await expect(page.locator('#settingsMenuHint')).toBeHidden();
  await expect(page.getByRole('button', { name: '出題・復習設定', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.locator('#settingsMenuHint')).toBeHidden();
});

test('省スペース設定入口はその他とドットだけを表示し、設定の開閉でモードを変えない', async ({ page }, testInfo) => {
  await expect(page.locator('.other-menu-caption')).toHaveText('その他');
  await expect(page.locator('#reviewSettingsButton')).toHaveCount(0);
  await page.evaluate(() => {
    const words = vocabularyDatabase.basic.slice(0, 3);
    gameState.activeReviewLevels = ['basic'];
    gameState.reviewMode = 'random';
    words.forEach(word => {
      const key = getWordKeySafe(word, word.__sourceLevel || 'basic');
      gameState.wordStates[key] = 'weak';
      gameState.srsData[key] = { dueAt: Date.now() - 1000 };
    });
    updateReviewProgressUI();
  });
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(['refresh-cw.svg'].map(name => {
      const image = new Image();
      image.src = '/assets/icons/' + name;
      return image.decode();
    }));
  });
  for (const width of [320, 375, 390, 1280]) {
    await page.setViewportSize({ width, height: width > 600 ? 800 : 740 });
    const layout = await page.evaluate(() => {
      const caption = document.querySelector('.other-menu-caption');
      const rect = caption.getBoundingClientRect();
      const level = document.getElementById('levelCurrentBtn').getBoundingClientRect();
      const controls = [...document.querySelector('.review-progress-actions').children].map(el => el.getBoundingClientRect());
      return { left: rect.left, right: rect.right, levelLeft: level.left,
        captionAboveLevel: rect.bottom <= level.top,
        captionFits: caption.scrollWidth <= caption.clientWidth,
        rightEdge: controls.at(-1).right,
        overlaps: controls.slice(1).some((r, i) => r.left < controls[i].right),
        overflow: document.documentElement.scrollWidth > innerWidth };
    });
    expect(layout.captionFits).toBe(true);
    expect(layout.left).toBeGreaterThanOrEqual(0);
    expect(layout.captionAboveLevel || layout.right <= layout.levelLeft).toBe(true);
    expect(layout.rightEdge).toBeLessThanOrEqual(width);
    expect(layout.overlaps).toBe(false);
    expect(layout.overflow).toBe(false);
    await page.screenshot({ path: 'screenshots/menu-dot-' + width + '-' + testInfo.project.name + '.png' });
  }
  const before = await page.evaluate(() => gameState.reviewMode);
  await page.getByRole('button', { name: 'その他メニュー' }).click();
  await page.getByRole('button', { name: '出題・復習設定', exact: true }).click();
  await expect(page.locator('#studyModeModal')).toBeVisible();
  await page.getByRole('button', { name: '出題・復習設定を閉じる', exact: true }).click();
  expect(await page.evaluate(() => gameState.reviewMode)).toBe(before);
});
