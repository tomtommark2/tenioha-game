const { test, expect } = require('@playwright/test');

test('管理メニューの閉じるボタンはホバー前から見えて操作できる', async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    localStorage.setItem('vocabGame_skipWelcome', 'true');
    localStorage.setItem('vocabGame_disableAutoUpdate', 'true');
    localStorage.setItem('vocabGame_lastAutoShownAnnouncementId', '2026-09-11-illustrated-wordbook');
  });
  await page.goto('/index.html');
  const widths = testInfo.project.name.startsWith('mobile-') ? [390] : [1280, 390];
  for (const width of widths) {
    await page.setViewportSize({ width, height: 844 });
    const trigger = page.locator('#topActionMenuBtn');
    await trigger.focus();
    await trigger.click();
    const close = page.getByRole('button', { name: '管理メニューを閉じる', exact: true });
    await page.mouse.move(0, 0);
    await expect(close).toBeVisible();
    const style = await close.evaluate(button => {
      const css = getComputedStyle(button);
      const rect = button.getBoundingClientRect();
      return { color: css.color, opacity: css.opacity, width: rect.width, height: rect.height };
    });
    expect(style.color).toBe(width === 1280 ? 'rgb(47, 58, 82)' : 'rgb(23, 26, 45)');
    expect(style.opacity).toBe('1');
    expect(style.width).toBeGreaterThanOrEqual(44);
    expect(style.height).toBeGreaterThanOrEqual(44);
    await page.screenshot({ path: testInfo.outputPath(`admin-close-${width}.png`) });
    await close.click();
    await expect(page.locator('#helpModal')).toBeHidden();
    await expect(trigger).toBeVisible();
    if (!testInfo.project.name.startsWith('mobile-')) await expect(trigger).toBeFocused();
  }
});
