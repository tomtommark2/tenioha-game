const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const phase = process.env.PHRASE_LAYOUT_PHASE || 'after';

test('画像・意味カード・例文切替の幅別表示と選択動作を確認する', async ({ page, browserName }) => {
  test.setTimeout(120000);
  await page.route(/https?:\/\/(?!localhost:8000)/, route => {
    const host = new URL(route.request().url()).hostname;
    return ['fonts.googleapis.com', 'fonts.gstatic.com'].includes(host) ? route.continue() : route.abort();
  });
  await page.addInitScript(() => {
    localStorage.setItem('vocabGame_skipWelcome', 'true');
    localStorage.setItem('vocabGame_disableAutoUpdate', 'true');
    localStorage.setItem('vocabGame_installGuideDismissed', 'true');
  });
  await page.goto('/index.html');
  await expect(page.locator('#vocabWord')).toHaveText('クリックしてスタート');
  const directory = path.resolve('screenshots/compact-example-selector-2026-09-09', `${phase}-${browserName}`);
  fs.mkdirSync(directory, { recursive: true });
  const log = [];
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const spelling of ['lot', 'most', 'yeah', 'round', 'last', 'short', 'back', 'apple']) {
      const senses = await page.evaluate(spelling => {
        const record = ['junior', 'basic', 'daily', 'exam1'].flatMap(level => vocabularyDatabase[level].map(word => ({ level, word }))).find(r => r.word.word === spelling);
        activateLearningSessionUI();
        gameState.currentLevel = record.level;
        loadVocabularyForLevel();
        initializeWordStates();
        gameState.currentWord = record.word;
        showWord(record.word);
        return record.word.senses || [record.word];
      }, spelling);
      await page.locator('#meaningCard').click();
      if (phase === 'before' && senses.length > 1) {
        // Reproduce the pre-change button layout without changing the application source.
        await page.evaluate(senses => {
          const tabs = document.getElementById('exampleSenseTabs');
          tabs.replaceChildren();
          tabs.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;margin-bottom:6px';
          senses.forEach((sense, index) => {
            const button = document.createElement('button');
            button.textContent = sense.pos + (senses.filter(s => s.pos === sense.pos).length > 1 ? ` ${index + 1}` : '');
            button.style.cssText = 'min-width:44px;min-height:44px;padding:5px 10px;border:1px solid #d9c980;border-radius:8px;background:transparent;cursor:pointer';
            tabs.append(button);
          });
        }, senses);
      }
      await page.evaluate(() => document.fonts.ready);
      if (phase === 'after' && senses.length > 1) {
        const select = page.getByRole('combobox', { name: '例文の用法' });
        await expect(select).toBeVisible();
        await expect(select.locator('option')).toHaveCount(senses.length);
        await expect(page.locator('#exampleSenseTabs button')).toHaveCount(0);
        for (let i = 0; i < senses.length; i++) {
          await select.selectOption(String(i));
          await expect(page.locator('#exampleSentence')).toHaveText(senses[i].example);
        }
      }
      if (['back', 'apple'].includes(spelling)) {
        await expect(page.locator('#wordIllustration')).toBeVisible();
      }
      const metrics = await page.evaluate(() => {
        const rect = id => {
          const el = document.getElementById(id);
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom };
        };
        const overflow = [...document.querySelectorAll('.merged-sense, #exampleSentence')].filter(el => {
          const range = document.createRange();
          range.selectNodeContents(el);
          const r = range.getBoundingClientRect();
          const card = el.closest('.card, .example-area').getBoundingClientRect();
          return r.left < card.left || r.right > card.right;
        }).map(el => el.id || el.className);
        return { example: rect('exampleArea'), selector: rect('exampleSenseTabs'), image: rect('wordIllustration'), cards: rect('cardsArea'), overflow,
          documentWidth: document.documentElement.scrollWidth, viewportWidth: innerWidth };
      });
      expect(metrics.overflow).toEqual([]);
      expect(metrics.documentWidth).toBeLessThanOrEqual(width);
      if (phase === 'after' && metrics.selector) expect(metrics.selector.height).toBeLessThanOrEqual(44);
      if (metrics.image) {
        expect(metrics.image.right).toBeLessThanOrEqual(width);
        expect(metrics.image.x).toBeGreaterThanOrEqual(0);
        expect(Math.abs(metrics.image.width - metrics.image.height)).toBeLessThan(1);
      }
      const file = `${width}-${spelling}.png`;
      await page.screenshot({ path: path.join(directory, file), fullPage: true, animations: 'disabled' });
      log.push({ word: spelling, width, file, ...metrics });
    }
  }
  fs.writeFileSync(path.join(directory, 'manifest.json'), JSON.stringify(log, null, 2) + '\n');
});
