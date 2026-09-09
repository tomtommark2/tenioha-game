const { test, expect } = require('@playwright/test');

for (const width of [1280, 390]) {
  test(`元のキャラクター素材とコマ送りを維持 (${width}px)`, async ({ page }) => {
    await page.setViewportSize({ width, height: 850 });
    await page.goto('/index.html');
    const hero = page.locator('#heroCharacter');
    await expect(hero).toHaveCSS('animation-name', 'sprite-play');
    await expect(hero).toHaveCSS('animation-duration', '1.2s');
    await expect(hero).toHaveCSS('animation-timing-function', 'steps(6)');
    await expect(hero).toHaveCSS('background-size', '300px 256px');
    const source = await hero.evaluate(async (element) => {
      const image = new Image();
      image.src = getComputedStyle(element).backgroundImage.slice(5, -2);
      await image.decode();
      return image.src;
    });
    expect(source).toContain('/assets/char_sprite.png');
  });
}
