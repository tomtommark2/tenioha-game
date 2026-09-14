const { test, expect } = require('@playwright/test');
const repairs = require('../docs/experiments/alpha-repair-2026-09-14/repairs.json');
test('採用した修正版とdish旧版を学習画面で読み込める', async ({page}) => {
  await page.addInitScript(() => {
    localStorage.setItem('vocabGame_skipWelcome', 'true');
    localStorage.setItem('vocabGame_disableAutoUpdate', 'true');
  });
  await page.goto('/index.html');
  await expect(page.locator('#vocabWord')).toHaveText('クリックしてスタート');
  const sources=repairs.entries.map(e=>e.selected===false?e.previous:e.delivery);
  const entries=await page.evaluate(sources=>WORD_ILLUSTRATIONS.filter(e=>sources.includes(e.src)||e.word==='January'),sources);
  expect(entries).toHaveLength(9);
  for(const e of entries){
    await page.evaluate(e=>{
      activateLearningSessionUI();
      gameState.currentLevel=e.level;
      gameState.currentWord=vocabularyDatabase[e.level].find(w=>w.word===e.word);
      showWord(gameState.currentWord);
    },e);
    await page.locator('#meaningCard').click();
    const img=page.locator('#wordIllustration');
    await expect(img).toBeVisible();
    await expect(img).toHaveAttribute('src',e.src);
    await img.evaluate(i=>i.decode());
    if(e.word==='January'){
      expect(await img.evaluate(i=>{
        const c=document.createElement('canvas');c.width=i.naturalWidth;c.height=i.naturalHeight;
        const ctx=c.getContext('2d');ctx.drawImage(i,0,0);
        const d=ctx.getImageData(271,748,118,254).data;let min=255;
        for(let j=3;j<d.length;j+=4)min=Math.min(min,d[j]);return min;
      })).toBeGreaterThanOrEqual(250);
    }
  }
});
