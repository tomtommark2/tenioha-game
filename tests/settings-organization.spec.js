const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page, baseURL }) => {
  const origin = new URL(baseURL).origin;
  await page.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  await page.addInitScript(() => {
    localStorage.setItem('vocabGame_skipWelcome', 'true');
    localStorage.setItem('vocabGame_disableAutoUpdate', 'true');
    localStorage.setItem('vocabGame_installGuideDismissed', 'true');
  });
  await page.goto('/index.html');
  await expect(page.locator('#otherMenuBtn')).toBeVisible();
});

async function openSettings(page) {
  await page.getByRole('button', { name: 'その他メニュー', exact: true }).click();
  await page.getByRole('button', { name: '出題・復習設定', exact: true }).click();
  await expect(page.locator('#studyModeModal')).toBeVisible();
}

async function records(page) {
  return page.evaluate(() => JSON.stringify({
    mode: gameState.currentMode, reviewMode: gameState.reviewMode, word: gameState.currentWord,
    states: gameState.wordStates, srs: gameState.srsData, score: gameState.reviewScore,
    range: gameState.activeReviewLevels, pos: gameState.posFilters, undo: gameStateHistory,
    save: localStorage.getItem('vocabClickerSave'), dirty: window.isDirty
  }));
}

test('学習設定：3分類は表示だけを切り替え、再度開くと出題から始まる', async ({ page }) => {
  await page.evaluate(() => { startLearningSession(); saveState(); });
  await openSettings(page);
  const before = await records(page);
  const historyLength = await page.evaluate(() => history.length);
  await expect(page.getByRole('tab', { name: '出題', exact: true })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#reviewRecommendationEnabled')).toBeHidden();
  await expect(page.locator('#illustrationAlwaysVisible')).toBeHidden();
  for (const [label, panel] of [['復習', 'Review'], ['表示', 'Display'], ['出題', 'Questions']]) {
    await page.getByRole('tab', { name: label, exact: true }).click();
    await expect(page.getByRole('tabpanel')).toHaveCount(1);
    await expect(page.locator('#studySettings' + panel)).toBeVisible();
    expect(await records(page)).toBe(before);
    expect(await page.evaluate(() => history.length)).toBe(historyLength);
  }
  await page.getByRole('tab', { name: '復習', exact: true }).click();
  await expect(page.locator('#masterySettingsSummary')).toHaveText('直近5回・80%');
  await page.locator('#masterySettings > summary').click();
  await page.locator('[data-review-window="10"]').click();
  await page.locator('[data-mastery-threshold="90"]').click();
  await expect(page.locator('#masterySettingsSummary')).toHaveText('直近10回・90%');
  await page.getByRole('tab', { name: '表示', exact: true }).click();
  await page.getByRole('button', { name: '出題・復習設定を閉じる', exact: true }).click();
  await openSettings(page);
  await expect(page.getByRole('tab', { name: '出題', exact: true })).toHaveAttribute('aria-selected', 'true');
  await page.reload();
  await openSettings(page);
  await page.getByRole('tab', { name: '復習', exact: true }).click();
  await expect(page.locator('#masterySettingsSummary')).toHaveText('直近10回・90%');
});

test('学習設定：説明は必要な補足だけに絞り、保存結果は操作後に表示する', async ({ page }) => {
  await openSettings(page);
  await expect(page.locator('.study-mode-subtitle')).toHaveCount(0);
  await expect(page.locator('#reviewModeDescription')).toBeHidden();
  await expect(page.locator('[data-review-mode-option="off"]')).toHaveText('新規だけ');
  await expect(page.locator('[data-review-mode-option="on"]')).toHaveText('復習だけ');
  await page.getByRole('tab', { name: '表示', exact: true }).click();
  await expect(page.getByRole('switch', { name: 'イラストを常時表示', exact: true })).toBeVisible();
  await expect(page.locator('#illustrationVisibilityDescription')).toBeHidden();
  await expect(page.locator('#illustrationAlwaysVisible')).not.toHaveAttribute('aria-describedby', /.+/);
  await expect(page.getByRole('switch', { name: '正答率・出題理由を表示', exact: true })).toBeVisible();
  await expect(page.locator('#cardStatusDescription')).toBeEmpty();
  await expect(page.locator('#cardStatusDescription')).toBeHidden();
  await expect(page.locator('#cardStatusVisible')).not.toHaveAttribute('aria-describedby', /.+/);
  for (const id of ['illustrationVisibilityStatus', 'cardStatusSettingsStatus']) {
    await expect(page.locator('#' + id)).toBeEmpty();
    await expect(page.locator('#' + id)).toBeHidden();
  }
  await page.getByRole('switch', { name: 'イラストを常時表示', exact: true }).check();
  await expect(page.locator('#illustrationVisibilityStatus')).toBeVisible();
  await expect(page.locator('#illustrationVisibilityStatus')).toHaveText('このブラウザに保存しました。');
  await page.getByRole('tab', { name: '復習', exact: true }).click();
  await expect(page.locator('#reviewRecommendationDescription')).toHaveText('今すぐ復習できる単語が100語を超えたら案内します。');
  await expect(page.locator('#reviewRecommendationSettingsStatus')).toBeHidden();
  await page.locator('#reviewTimingSettings > summary').click();
  await expect(page.locator('[data-review-timing="standard"]')).toHaveText('標準');
  await expect(page.locator('#reviewTimingStatus')).toBeHidden();
  await page.locator('[data-review-timing="long"]').click();
  await expect(page.locator('#reviewTimingStatus')).toBeVisible();
  await expect(page.locator('#reviewTimingStatus')).toContainText('保存しました');
  await page.locator('#masterySettings > summary').click();
  await expect(page.locator('#masteryThresholdValue')).toBeHidden();
  await expect(page.locator('#masteryChangePreview')).toBeHidden();
  await expect(page.locator('#masteryPendingNotice')).toHaveText('回答が5回未満なら、回答済みの回数で判定します。');
  await expect(page.locator('#masterySettings .study-mode-details')).not.toHaveAttribute('open', '');
  await page.locator('[data-review-window="10"]').click();
  await expect(page.locator('#masteryChangePreview')).toBeVisible();
  await expect(page.locator('#masteryChangePreview')).toContainText('保存しました');
});

test('学習設定：矢印キー・Tab・Escape・ブラウザ戻るで迷わず操作できる', async ({ page }) => {
  await openSettings(page);
  await expect(page.getByRole('button', { name: '出題・復習設定を閉じる', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#studySettingsQuestionsTab')).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#studySettingsReviewTab')).toBeFocused();
  await expect(page.locator('#studySettingsReviewTab')).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('End');
  await expect(page.locator('#studySettingsDisplayTab')).toBeFocused();
  await page.keyboard.press('Home');
  await expect(page.locator('#studySettingsQuestionsTab')).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('#studySettingsDisplayTab')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#illustrationAlwaysVisible')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('#studySettingsDisplayTab')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('#studyModeModal')).toBeHidden();
  await expect(page.locator('#otherMenuBtn')).toBeFocused();
  await openSettings(page);
  await page.getByRole('tab', { name: '復習', exact: true }).click();
  await page.getByRole('tab', { name: '表示', exact: true }).click();
  await page.goBack();
  await expect(page.locator('#studyModeModal')).toBeHidden();
  await expect(page.locator('#otherMenuBtn')).toBeFocused();
});

test('学習設定：320〜1280pxで3分類と詳細が収まりスクロール中も出口を保つ', async ({ page }, testInfo) => {
  await openSettings(page);
  const modal = page.locator('#studyModeModal .study-mode-modal-content');
  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: width === 1280 ? 800 : 740 });
    for (const category of ['出題', '復習', '表示']) {
      await page.getByRole('tab', { name: category, exact: true }).click();
      const bounds = await modal.evaluate(el => {
        const rect = el.getBoundingClientRect();
        return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom,
          fits: el.scrollWidth <= el.clientWidth, pageFits: document.documentElement.scrollWidth <= innerWidth };
      });
      expect(bounds.left).toBeGreaterThanOrEqual(0);
      expect(bounds.right).toBeLessThanOrEqual(width);
      expect(bounds.top).toBeGreaterThanOrEqual(0);
      expect(bounds.bottom).toBeLessThanOrEqual(width === 1280 ? 800 : 740);
      expect(bounds.fits && bounds.pageFits).toBe(true);
      await expect(page.getByRole('tablist')).toBeInViewport();
      if (width !== 390) await page.screenshot({ path: `screenshots/settings-${category}-${width}-${testInfo.project.name}.png` });
      const details = category === '出題' ? page.locator('#studySettingsQuestions .study-scope-card')
        : category === '復習' ? page.locator('#masterySettings') : null;
      if (details) {
        if (await details.getAttribute('open') === null) await details.locator('summary').first().click();
        await modal.evaluate(el => { el.scrollTop = el.scrollHeight; });
        await expect(page.getByRole('tablist')).toBeInViewport();
        await expect(page.getByRole('button', { name: '出題・復習設定を閉じる', exact: true })).toBeInViewport();
        expect(await modal.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
        await details.locator('summary').first().click();
      }
    }
  }
  await page.evaluate(() => openReviewTimingSettings());
  await expect(page.getByRole('tab', { name: '復習', exact: true })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#reviewTimingSettings')).toHaveAttribute('open', '');
  await expect(page.locator('#reviewTimingSettings > summary')).toBeFocused();
});
