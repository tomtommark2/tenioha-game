const { test, expect } = require('@playwright/test');

const START_INTERACTION_TEST = 'クリックしてスタートで最初の単語を表示する';

test.beforeEach(async ({ page }, testInfo) => {
  if (testInfo.title === START_INTERACTION_TEST) return;

  await page.addInitScript(() => {
    window.addEventListener('DOMContentLoaded', () => {
      const prompt = document.querySelector('#vocabWord[data-learning-start="true"]');
      if (prompt) document.getElementById('vocabCard')?.click();
    }, { once: true });
  });
});

function isIgnorableConsoleError(text) {
  // 必要最小限の除外（環境依存ノイズのみ）
  const ignorePatterns = [
    /favicon\.ico/i,
    /ERR_BLOCKED_BY_CLIENT/i,
  ];
  return ignorePatterns.some((re) => re.test(text));
}

test(START_INTERACTION_TEST, async ({ page }) => {
  const htmlResponse = await page.request.get('/index.html');
  const html = await htmlResponse.text();
  expect(html).not.toContain('ファイルを読み込んでください');
  expect(html).toContain('クリックしてスタート');

  await page.goto('/index.html');
  await expect(page.locator('#vocabCard')).toBeVisible();
  await expect(page.locator('#meaningCard')).toBeVisible();
  await expect(page.locator('#vocabWord')).toHaveText('クリックしてスタート');
  await expect(page.locator('#meaningCard')).toHaveAttribute('aria-disabled', 'true');
  await expect.poll(() => page.evaluate(() => window.gameState?.currentWord || null)).toBeNull();
  const waitingTrialSeconds = await page.evaluate(() => {
    window.trialState.playTimeSeconds = 0;
    window.lastTickTime = Date.now() - 5000;
    window.updateTrialTimer();
    return window.trialState.playTimeSeconds;
  });
  expect(waitingTrialSeconds).toBe(0);

  await page.locator('#vocabCard').click();
  await expect.poll(() => page.evaluate(() => window.gameState?.currentWord?.word || null)).not.toBeNull();
  await expect(page.locator('#vocabWord')).not.toHaveText('クリックしてスタート');
  await expect(page.locator('#meaningCard')).not.toHaveAttribute('aria-disabled');
  await expect(page.locator('#vocabWord')).not.toHaveAttribute('aria-busy');
  await expect(page.locator('#exampleSentence')).not.toHaveAttribute('aria-busy');
  const activeTrialSeconds = await page.evaluate(() => {
    window.lastTickTime = Date.now() - 5000;
    window.updateTrialTimer();
    return window.trialState.playTimeSeconds;
  });
  expect(activeTrialSeconds).toBeGreaterThanOrEqual(4.5);
});

test('学習ログを廃止し、語彙力推定と復習ランキングを残す', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('vocabGame_skipWelcome', 'true');
    localStorage.setItem('vocabGame_disableAutoUpdate', 'true');
  });
  await page.goto('/vocab_clicker_game.html', { waitUntil: 'domcontentloaded' });

  const menuLabels = await page.locator('#otherMenuDropdown .other-menu-label').allTextContents();
  expect(menuLabels).not.toContain('学習ログ');
  expect(menuLabels).toContain('語彙力推定');
  expect(menuLabels).toContain('ランキング');
  await expect(page.locator('#learningLogPreviewModal')).toHaveCount(0);
  expect(await page.evaluate(() => typeof window.openLearningLogPreviewModal)).toBe('undefined');
  expect(await page.evaluate(() => typeof window.openLearningLogModal)).toBe('function');
  expect(await page.evaluate(() => typeof window.openLeaderboard)).toBe('function');
  await page.evaluate(() => window.openLearningLogModal());
  await expect(page.locator('#learningLogModal')).toBeVisible();
  await expect(page.locator('#vocabDiagnosisContainer .vocab-diagnosis-card')).toBeVisible();
});

test('無料版は10分到達後に回答できず再読み込み後もロックされる', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('vocabGame_skipWelcome', 'true');
    localStorage.setItem('vocabGame_disableAutoUpdate', 'true');
    localStorage.setItem('vocabGame_isUnlocked', 'false');
    localStorage.setItem('vocabGame_expiry', '0');
    if (!localStorage.getItem('vocabGame_trialState_v2')) {
      const today = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Tokyo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date());
      localStorage.setItem('vocabGame_trialState_v2', JSON.stringify({
        unlocked: false,
        lastPlayDate: today,
        playTimeSeconds: 599,
      }));
    }
  });

  await page.goto('http://localhost.:8000/vocab_clicker_game.html', { waitUntil: 'domcontentloaded' });
  await expect.poll(() => page.evaluate(() => window.gameState?.currentWord?.word || null)).not.toBeNull();

  const before = await page.evaluate(() => ({
    word: window.gameState.currentWord.word,
    actions: { ...window.gameState.actionCounts },
  }));
  await page.evaluate(() => {
    window.trialState.playTimeSeconds = 600;
    window.checkTrialLimit();
  });

  await expect(page.locator('#trialOverlay')).toBeVisible();
  await expect(page.locator('#trialOverlay')).not.toContainText('閉じる');

  await page.locator('#trialOverlay').evaluate((overlay) => {
    overlay.style.display = 'none';
  });
  await page.locator('#vocabCard').click({ force: true });
  await expect(page.locator('#trialOverlay')).toBeVisible();

  const after = await page.evaluate(() => ({
    word: window.gameState.currentWord.word,
    actions: { ...window.gameState.actionCounts },
    savedTrial: JSON.parse(localStorage.getItem('vocabGame_trialState_v2') || '{}'),
  }));
  expect(after.word).toBe(before.word);
  expect(after.actions).toEqual(before.actions);
  expect(after.savedTrial.playTimeSeconds).toBeGreaterThanOrEqual(600);

  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('#trialOverlay')).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.gameState?.currentWord || null)).toBeNull();
});

test('期限切れのローカル解放状態では10分制限を解除しない', async ({ page }) => {
  await page.addInitScript(() => {
    const today = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
    localStorage.setItem('vocabGame_skipWelcome', 'true');
    localStorage.setItem('vocabGame_disableAutoUpdate', 'true');
    localStorage.setItem('vocabGame_isUnlocked', 'true');
    localStorage.setItem('vocabGame_expiry', String(Date.now() - 1000));
    localStorage.setItem('vocabGame_trialState_v2', JSON.stringify({
      unlocked: true,
      lastPlayDate: today,
      playTimeSeconds: 600,
    }));
  });

  await page.goto('http://localhost.:8000/vocab_clicker_game.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#trialOverlay')).toBeVisible();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('vocabGame_isUnlocked'))).toBe('false');
  await expect.poll(() => page.evaluate(() => window.trialState.unlocked)).toBe(false);
});

test('有効期限内のプレミアム利用者は10分を超えてもロックしない', async ({ page }) => {
  await page.addInitScript(() => {
    const today = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
    localStorage.setItem('vocabGame_skipWelcome', 'true');
    localStorage.setItem('vocabGame_disableAutoUpdate', 'true');
    localStorage.setItem('vocabGame_isUnlocked', 'true');
    localStorage.setItem('vocabGame_expiry', String(Date.now() + 86400000));
    localStorage.setItem('vocabGame_trialState_v2', JSON.stringify({
      unlocked: false,
      lastPlayDate: today,
      playTimeSeconds: 600,
    }));
  });

  await page.goto('http://localhost.:8000/vocab_clicker_game.html', { waitUntil: 'domcontentloaded' });
  await expect.poll(() => page.evaluate(() => window.gameState?.currentWord?.word || null)).not.toBeNull();
  await expect(page.locator('#trialOverlay')).toBeHidden();
  await expect(page.locator('#trialTimerDisplay')).toBeHidden();
  await expect.poll(() => page.evaluate(() => window.trialState.unlocked)).toBe(true);
});

test('再起動時は端末で最後に選んだ学習レベルを優先する', async ({ context, page }) => {
  await context.addInitScript(() => {
    localStorage.setItem('vocabGame_skipWelcome', 'true');
    if (!localStorage.getItem('vocabClickerSave')) {
      localStorage.setItem('vocabClickerSave', JSON.stringify({
        currentLevel: 'junior',
        currentMode: 'unlearned',
        reviewMode: 'off',
        wordStates: {},
        srsData: {},
        lastSaveTime: Date.now()
      }));
    }
  });

  await page.goto('/vocab_clicker_game.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#vocabWord')).not.toContainText('ファイルを読み込んでください');

  await expect(page.locator('#levelCurrentLabel')).toHaveText('中学');
  await page.locator('#levelCurrentBtn').click();
  await page.locator('.level-btn[data-level="daily"]').click();
  await expect.poll(async () => page.evaluate(() => localStorage.getItem('vocabGame_lastLevel'))).toBe('daily');

  await page.close();
  const reopenedPage = await context.newPage();
  await reopenedPage.goto('/vocab_clicker_game.html', { waitUntil: 'domcontentloaded' });
  await expect(reopenedPage.locator('#vocabWord')).not.toContainText('ファイルを読み込んでください');
  await expect.poll(async () => reopenedPage.evaluate(() => window.gameState.currentLevel)).toBe('daily');
  await expect(reopenedPage.locator('#levelCurrentLabel')).toHaveText('標準');
  await expect(reopenedPage.locator('.level-btn[data-level="daily"]')).toHaveClass(/active/);
});

test('通常保存は明示的に選んだ最終レベルを上書きしない', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('vocabGame_skipWelcome', 'true');
  });
  await page.goto('/vocab_clicker_game.html', { waitUntil: 'domcontentloaded' });

  await page.locator('#levelCurrentBtn').click();
  await page.locator('.level-btn[data-level="exam1"]').click();
  await expect.poll(async () => page.evaluate(() => localStorage.getItem('vocabGame_lastLevel'))).toBe('exam1');

  await page.evaluate(() => {
    window.gameState.currentLevel = 'basic';
    window.saveGame();
  });

  await expect.poll(async () => page.evaluate(() => localStorage.getItem('vocabGame_lastLevel'))).toBe('exam1');
});

test('ローカル開発ではAnalyticsを停止する', async ({ page }) => {
  await page.goto('/index.html', { waitUntil: 'load' });

  await expect.poll(() => page.evaluate(
    () => window['ga-disable-G-QHRLNKJ4CH'] === true
  )).toBe(true);
});

test('新規ユーザーにはインストール画面を挟まず短いチュートリアルを表示する', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem('vocabGame_disableAutoUpdate', 'true');
  });

  await page.goto('/vocab_clicker_game.html?tutorialPreview=1', { waitUntil: 'load' });

  await expect(page).toHaveTitle('てにをは英単語');
  await expect(page.locator('#welcomeOverlay')).toHaveCount(0);
  await expect(page.locator('#liveTutorialHint')).toBeVisible();
  await expect(page.getByRole('button', { name: 'チュートリアルを閉じる' })).toBeVisible();

  const manifest = await page.evaluate(async () => (await fetch('/manifest.json')).json());
  expect(manifest.name).toBe('てにをは英単語');
  expect(manifest.short_name).toBe('てにをは英単語');
});

test('旧導線を通過済みのユーザーにはチュートリアルを再表示しない', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem('vocabGame_skipWelcome', 'true');
    localStorage.setItem('vocabGame_disableAutoUpdate', 'true');
  });

  await page.goto('/vocab_clicker_game.html', { waitUntil: 'load' });

  await expect(page.locator('#liveTutorialHint')).toBeHidden();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('vocabGame_onboardingVersion'))).toBe('2');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('vocabGame_skipLiveTutorial'))).toBe('true');
});

test('チュートリアルを閉じると完了状態を保存する', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem('vocabGame_disableAutoUpdate', 'true');
  });

  await page.goto('/vocab_clicker_game.html?tutorialPreview=1', { waitUntil: 'load' });
  await expect(page.locator('#liveTutorialHint')).toBeVisible();

  await page.getByRole('button', { name: 'チュートリアルを閉じる' }).click({ force: true });

  await expect(page.locator('#liveTutorialHint')).toBeHidden();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('vocabGame_onboardingVersion'))).toBe('2');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('vocabGame_skipLiveTutorial'))).toBe('true');
});

test('iPhone Safari向けアプリ化案内を図解し永続非表示後も手動で再確認できる', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.addInitScript(() => {
    localStorage.setItem('vocabGame_skipWelcome', 'true');
    localStorage.setItem('vocabGame_disableAutoUpdate', 'true');
  });

  await page.goto('/vocab_clicker_game.html?installGuide=ios-safari', { waitUntil: 'domcontentloaded' });
  const notice = page.locator('#installGuideNotice');
  await expect(notice).toBeVisible();
  await expect(notice).toContainText('iPhoneでもアプリにできます');

  await page.locator('#installGuideNoticeAction').click();
  const modal = page.locator('#installGuideModal');
  await expect(modal).toBeVisible();
  await expect(page.locator('#installGuideModalTitle')).toHaveText('iPhoneのホーム画面に追加');
  await expect(page.locator('#installGuideSteps')).toContainText('共有ボタンを押す');
  await expect(page.locator('#installGuideSteps')).toContainText('ホーム画面に追加');
  await expect(page.locator('.install-guide-step-visual')).toHaveCount(3);

  const cardBox = await page.locator('.install-guide-card').boundingBox();
  expect(cardBox).not.toBeNull();
  expect(cardBox.x).toBeGreaterThanOrEqual(0);
  expect(cardBox.y).toBeGreaterThanOrEqual(0);
  expect(cardBox.x + cardBox.width).toBeLessThanOrEqual(375);
  expect(cardBox.y + cardBox.height).toBeLessThanOrEqual(667);

  await page.locator('#installGuideNeverShow').check();
  await page.locator('#installGuideModalClose').click();
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(notice).toBeHidden();

  await page.evaluate(() => window.openInstallGuide());
  await expect(modal).toBeVisible();
});

test('標準インストール対応時は右下ボタンからブラウザのpromptを呼ぶ', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('vocabGame_skipWelcome', 'true');
    localStorage.setItem('vocabGame_disableAutoUpdate', 'true');
    window.__installPromptCalls = 0;
  });

  await page.goto('/vocab_clicker_game.html', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    const event = new Event('beforeinstallprompt');
    event.prompt = () => {
      window.__installPromptCalls += 1;
    };
    event.userChoice = Promise.resolve({ outcome: 'dismissed' });
    window.dispatchEvent(event);
  });

  await expect(page.locator('#installGuideNotice')).toBeVisible();
  await expect(page.locator('#installGuideNoticeAction')).toHaveText('追加する');
  await page.locator('#installGuideNoticeAction').click();
  await expect.poll(async () => page.evaluate(() => window.__installPromptCalls)).toBe(1);
  await expect(page.locator('#installGuideNotice')).toBeHidden();
});

test('アプリ化案内はiPhone別ブラウザ・Android・汎用環境で内容を切り替える', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('vocabGame_skipWelcome', 'true');
    localStorage.setItem('vocabGame_disableAutoUpdate', 'true');
  });

  const cases = [
    { mode: 'ios-other', notice: 'Safariから追加できます', modal: 'Safariで開いてアプリ化' },
    { mode: 'android', notice: 'AndroidではChromeがおすすめ', modal: 'Androidでアプリとして使う' },
    { mode: 'manual', notice: 'アプリとしてすぐ開けます', modal: 'この端末でアプリとして使う' },
  ];

  for (const item of cases) {
    await page.goto(`/vocab_clicker_game.html?installGuide=${item.mode}`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#installGuideNotice')).toContainText(item.notice);
    await page.locator('#installGuideNoticeAction').click();
    await expect(page.locator('#installGuideModalTitle')).toHaveText(item.modal);
  }
});

test('その他メニューは読み上げ名とキーボード操作に対応する', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('vocabGame_skipWelcome', 'true');
    localStorage.setItem('vocabGame_disableAutoUpdate', 'true');
  });

  await page.goto('/vocab_clicker_game.html', { waitUntil: 'domcontentloaded' });

  const trigger = page.getByRole('button', { name: 'その他メニュー' });
  const items = page.locator('#otherMenuDropdown .other-menu-item');

  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await trigger.press('Enter');
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect(items).toHaveCount(4);
  await expect(items.first()).toBeVisible();
  await expect.poll(() => items.evaluateAll((elements) => elements.every((element) => element.tagName === 'BUTTON'))).toBe(true);

  await trigger.press('Enter');
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect(items.first()).toBeHidden();
});

test('管理メニューはダイアログとしてキーボード操作できる', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('vocabGame_skipWelcome', 'true');
    localStorage.setItem('vocabGame_disableAutoUpdate', 'true');
  });

  await page.goto('/vocab_clicker_game.html', { waitUntil: 'domcontentloaded' });

  const trigger = page.getByRole('button', { name: '管理メニュー' });
  const dialog = page.getByRole('dialog', { name: '管理メニュー' });

  await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
  await trigger.press('Enter');
  await expect(dialog).toBeVisible();

  const items = dialog.locator('.help-list-item');
  await expect(items).toHaveCount(5);
  await expect.poll(() => items.evaluateAll((elements) => elements.every((element) => element.tagName === 'BUTTON'))).toBe(true);

  await dialog.getByRole('button', { name: '管理メニューを閉じる' }).click();
  await expect(dialog).toBeHidden();
});

test('意味カードをクリックすると反転する', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('vocabGame_skipWelcome', 'true');
    localStorage.setItem('vocabGame_disableAutoUpdate', 'true');
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

test('例文スピーカーボタンは現在の例文を読み上げる', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('vocabGame_skipWelcome', 'true');
    localStorage.setItem('vocabGame_disableAutoUpdate', 'true');
    window.__spokenTexts = [];

    class FakeSpeechSynthesisUtterance {
      constructor(text) {
        this.text = text;
        this.lang = '';
        this.rate = 1;
        this.pitch = 1;
        this.volume = 1;
        this.voice = null;
      }
    }

    Object.defineProperty(window, 'SpeechSynthesisUtterance', {
      configurable: true,
      value: FakeSpeechSynthesisUtterance,
    });

    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: {
        speaking: false,
        pending: false,
        cancel() {},
        getVoices() {
          return [{ name: 'Test English', lang: 'en-US' }];
        },
        speak(utterance) {
          window.__spokenTexts.push(utterance.text);
        },
      },
    });
  });

  await page.goto('/vocab_clicker_game.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#vocabWord')).not.toContainText('ファイルを読み込んでください');

  const example = (await page.locator('#exampleSentence').innerText()).trim();
  await page.locator('#speakerBtn').click();

  await expect.poll(async () => page.evaluate(() => window.__spokenTexts.at(-1))).toBe(example);
});

test('戻る操作後に次の単語へ進んでも表示中の例文を読み上げる', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('vocabGame_skipWelcome', 'true');
    localStorage.setItem('vocabGame_disableAutoUpdate', 'true');
    window.__spokenTexts = [];

    class FakeSpeechSynthesisUtterance {
      constructor(text) {
        this.text = text;
        this.lang = '';
        this.rate = 1;
        this.pitch = 1;
        this.volume = 1;
        this.voice = null;
      }
    }

    Object.defineProperty(window, 'SpeechSynthesisUtterance', {
      configurable: true,
      value: FakeSpeechSynthesisUtterance,
    });
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: {
        speaking: false,
        pending: false,
        cancel() {},
        getVoices() {
          return [{ name: 'Test English', lang: 'en-US' }];
        },
        speak(utterance) {
          window.__spokenTexts.push(utterance.text);
        },
      },
    });
  });

  await page.goto('/vocab_clicker_game.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#vocabWord')).not.toContainText('ファイルを読み込んでください');

  const firstExample = (await page.locator('#exampleSentence').innerText()).trim();
  await page.locator('#vocabCard').click();
  await page.locator('#undoBtn').click();
  await expect(page.locator('#exampleSentence')).toHaveText(firstExample);

  await page.locator('#vocabCard').click();
  await expect.poll(async () => (await page.locator('#exampleSentence').innerText()).trim())
    .not.toBe(firstExample);
  await page.waitForTimeout(250);

  const currentExample = (await page.locator('#exampleSentence').innerText()).trim();
  await page.locator('#speakerBtn').click();
  await expect.poll(async () => page.evaluate(() => window.__spokenTexts.at(-1))).toBe(currentExample);
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
    await expect(btn).toHaveAttribute('aria-pressed', 'true');
  }
});

test('オート出題のUIと自動回答処理を公開しない', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('vocabGame_skipWelcome', 'true');
  });

  await page.goto('/vocab_clicker_game.html', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('#autoModeToggle')).toHaveCount(0);
  await expect(page.getByText('オート出題', { exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => typeof window.autoOpenMeaningCard)).toBe('undefined');
});

test('戻る操作は回答前の単語状態と出題位置をローカル保存まで復元する', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('vocabGame_skipWelcome', 'true');
  });

  await page.goto('/vocab_clicker_game.html', { waitUntil: 'domcontentloaded' });
  const before = await page.evaluate(() => {
    const gs = window.gameState;
    const word = gs.currentWord;
    const key = window.getWordKeySafe(word, word.__sourceLevel || gs.currentLevel);
    gs.wordStates[key] = 'weak';
    gs.srsData[key] = {
      ...(gs.srsData[key] || {}),
      dueAt: Date.now() - 1000,
      successCount: 1,
      failCount: 2,
      streak: 0,
      reviewStep: 1,
      scheduledIntervalDays: 1,
      everWrong: true,
      firstTryPerfect: false
    };
    gs.currentQuestionReason = 'manual-weak';
    gs.isReviewWord = true;
    window.updateDisplay();
    window.saveGame();
    return {
      key,
      word: word.word,
      wordState: gs.wordStates[key],
      srs: JSON.stringify(gs.srsData[key]),
      actionCounts: JSON.stringify(gs.actionCounts),
      interval: gs.learnedWordIntervals[key],
      intervalLast: gs.learnedWordIntervals[`${key}_last`],
      globalQuestionCount: gs.globalQuestionCount,
      currentMode: gs.currentMode
    };
  });

  await page.locator('#vocabCard').click();
  await expect(page.locator('#undoBtn')).toBeEnabled();
  await expect.poll(async () => page.evaluate((key) => {
    const saved = JSON.parse(localStorage.getItem('vocabClickerSave'));
    return saved.srsData[key].lastReviewedAt === window.gameState.srsData[key].lastReviewedAt;
  }, before.key)).toBe(true);
  await page.locator('#undoBtn').click();

  const after = await page.evaluate((key) => {
    const gs = window.gameState;
    const saved = JSON.parse(localStorage.getItem('vocabClickerSave'));
    return {
      key,
      word: gs.currentWord.word,
      wordState: gs.wordStates[key],
      srs: JSON.stringify(gs.srsData[key]),
      actionCounts: JSON.stringify(gs.actionCounts),
      interval: gs.learnedWordIntervals[key],
      intervalLast: gs.learnedWordIntervals[`${key}_last`],
      globalQuestionCount: gs.globalQuestionCount,
      currentMode: gs.currentMode,
      savedWordState: saved.wordStates[key],
      savedGlobalQuestionCount: saved.globalQuestionCount
    };
  }, before.key);

  expect(after).toMatchObject({
    key: before.key,
    word: before.word,
    wordState: before.wordState,
    srs: before.srs,
    actionCounts: before.actionCounts,
    interval: before.interval,
    intervalLast: before.intervalLast,
    globalQuestionCount: before.globalQuestionCount,
    currentMode: before.currentMode,
    savedWordState: before.wordState,
    savedGlobalQuestionCount: before.globalQuestionCount
  });
});

test('大規模学習データでも回答ホットパスを全状態コピーより軽く保つ', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('vocabGame_skipWelcome', 'true');
  });

  await page.goto('/vocab_clicker_game.html', { waitUntil: 'domcontentloaded' });
  const metrics = await page.evaluate(() => {
    const gs = window.gameState;
    const seen = new Set();
    let index = 0;
    Object.entries(window.vocabularyDatabase).forEach(([level, words]) => {
      (words || []).forEach(word => {
        const key = window.getWordKeySafe(word, level);
        if (seen.has(key)) return;
        seen.add(key);
        gs.wordStates[key] = index % 2 === 0 ? 'weak' : 'learned';
        gs.srsData[key] = {
          dueAt: Date.now() - (index % 1000),
          stability: 2,
          successCount: 2,
          failCount: 1,
          streak: 1,
          lastReviewedAt: Date.now() - 86400000,
          reviewStep: 2,
          scheduledIntervalDays: 3,
          isRelearning: false,
          everWrong: true,
          firstTryPerfect: false
        };
        index++;
      });
    });
    gs.activeReviewLevels = Object.keys(window.vocabularyDatabase);
    gs.posFilters = ['名', '動', '形', '副', '助', '前', '接', '代', 'other'];
    window.invalidateReviewWordIndex();

    const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
    const measure = (fn, count = 7) => {
      const values = [];
      for (let i = 0; i < count; i++) {
        const start = performance.now();
        fn();
        values.push(performance.now() - start);
      }
      return median(values);
    };

    window.buildReviewQueueSnapshot();
    const queueMs = measure(() => window.buildReviewQueueSnapshot());
    const progressMs = measure(() => window.buildLearningProgressSnapshot());
    const displayMs = measure(() => window.updateDisplay(), 5);
    const fullCloneMs = measure(() => structuredClone(gs), 5);
    const undoSnapshotMs = measure(() => window.saveState(), 5);
    return { queueMs, progressMs, displayMs, fullCloneMs, undoSnapshotMs, wordCount: seen.size };
  });

  console.log('[hot-path]', metrics);
  expect(metrics.wordCount).toBeGreaterThan(8000);
  expect(metrics.queueMs).toBeLessThan(50);
  expect(metrics.progressMs).toBeLessThan(30);
  expect(metrics.displayMs).toBeLessThan(80);
  expect(metrics.undoSnapshotMs).toBeLessThan(metrics.fullCloneMs * 0.6);
});

test('プロフィールモーダルを開閉できる', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('vocabGame_skipWelcome', 'true');
  });

  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/vocab_clicker_game.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#vocabWord')).not.toContainText('ファイルを読み込んでください');

  const modal = page.locator('#profileModal');
  const dialog = page.locator('.profile-modal-content');
  const scroller = page.locator('.profile-scroll-area');
  const closeButton = page.getByRole('button', { name: 'アカウントを閉じる' });
  await expect(modal).toBeHidden();

  // 開く
  await page.evaluate(() => {
    if (typeof window.openProfileModal === 'function') window.openProfileModal();
  });
  await expect(modal).toBeVisible();
  await expect(dialog).toHaveAttribute('role', 'dialog');
  await expect(dialog).toHaveAttribute('aria-modal', 'true');
  await expect(page.locator('body')).toHaveClass(/profile-modal-open/);
  await expect.poll(() => page.locator('body').evaluate((el) => getComputedStyle(el).overflowY)).toBe('hidden');
  await expect.poll(() => modal.evaluate((el) => getComputedStyle(el).overflowY)).toBe('hidden');
  await expect.poll(() => scroller.evaluate((el) => getComputedStyle(el).overflowY)).toBe('auto');

  // ログイン後に同期欄が増えても、閉じるボタンはスクロール領域の外に残る。
  await page.evaluate(() => {
    const syncSection = document.getElementById('profileSyncSection');
    const scrollArea = document.querySelector('.profile-scroll-area');
    if (syncSection) syncSection.style.display = 'block';
    if (scrollArea) scrollArea.scrollTop = scrollArea.scrollHeight;
  });
  await expect(closeButton).toBeVisible();

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
  await expect(page.locator('body')).not.toHaveClass(/profile-modal-open/);
});

test('未読お知らせはベルに通知マークを出し、開くと既読になる', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('vocabGame_skipWelcome', 'true');
    localStorage.removeItem('vocabGame_lastReadAnnouncementId');
  });

  await page.goto('/vocab_clicker_game.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#vocabWord')).not.toContainText('ファイルを読み込んでください');

  await expect(page.locator('#announcementUnreadDot')).toBeVisible();

  await page.locator('#announcementBtn').click();
  await expect(page.locator('#announcementModal')).toBeVisible();
  await expect(page.locator('#announcementList')).toContainText('発音表記を追加しました');
  await expect(page.locator('#announcementList')).toContainText('Duolingo標準');
  await expect(page.locator('#announcementUnreadDot')).toBeHidden();
});

test('復習の出し方を3択から直接選べる', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('vocabGame_skipWelcome', 'true');
  });

  await page.goto('/vocab_clicker_game.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#vocabWord')).not.toContainText('ファイルを読み込んでください');

  await page.evaluate(() => {
    if (typeof window.openStudyModeModal === 'function') window.openStudyModeModal();
  });

  const label = page.locator('#dueOnlyModeLabelModal');
  const offButton = page.locator('[data-review-mode-option="off"]');
  const mixButton = page.locator('[data-review-mode-option="random"]');
  const onButton = page.locator('[data-review-mode-option="on"]');

  await expect(label).toContainText('新規＋復習');
  await expect(mixButton).toHaveAttribute('aria-pressed', 'true');
  await onButton.click();
  await expect(label).toContainText('復習だけ');
  await expect(onButton).toHaveAttribute('aria-pressed', 'true');
  await offButton.click();
  await expect(label).toContainText('新規だけ');
  await expect(offButton).toHaveAttribute('aria-pressed', 'true');
  await mixButton.click();
  await expect(label).toContainText('新規＋復習');
});

test('復習モードON/OFF切替に分類ボタンの無効状態が即時同期する', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('vocabGame_skipWelcome', 'true');
  });

  await page.goto('/vocab_clicker_game.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#vocabWord')).not.toContainText('ファイルを読み込んでください');

  await page.evaluate(() => {
    window.gameState.reviewMode = 'random';
    if (typeof window.updateModeButtons === 'function') window.updateModeButtons();
  });

  const unlearnedButton = page.locator('.mode-btn[data-mode="unlearned"]');
  const lockNotice = page.locator('#modeSelectionLock');
  const modeShell = page.locator('#modeButtonsShell');
  await expect(unlearnedButton).not.toBeDisabled();
  await expect(unlearnedButton).not.toHaveClass(/disabled/);
  await expect(lockNotice).toBeHidden();
  await expect(modeShell).toHaveAttribute('aria-disabled', 'false');

  await page.evaluate(() => window.toggleDueOnlyMode());
  await expect.poll(async () => page.evaluate(() => window.gameState.reviewMode)).toBe('on');
  await expect(unlearnedButton).toBeDisabled();
  await expect(unlearnedButton).toHaveClass(/disabled/);
  await expect(unlearnedButton).toHaveAttribute('title', '復習だけモード中は分類を選べません');
  await expect(modeShell).toHaveClass(/is-locked/);
  await expect(modeShell).toHaveAttribute('aria-disabled', 'true');
  await expect(lockNotice).toBeVisible();
  await expect(lockNotice).toContainText('復習中は変更できません');
  await expect(lockNotice).toHaveAttribute('aria-hidden', 'false');

  await page.evaluate(() => window.toggleDueOnlyMode());
  await expect.poll(async () => page.evaluate(() => window.gameState.reviewMode)).toBe('off');
  await expect(unlearnedButton).not.toBeDisabled();
  await expect(unlearnedButton).not.toHaveClass(/disabled/);
  await expect(modeShell).not.toHaveClass(/is-locked/);
  await expect(modeShell).toHaveAttribute('aria-disabled', 'false');
  await expect(lockNotice).toBeHidden();
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
  await expect(inlineLabel).toContainText('新規＋復習');
  await inlineLabel.click();
  await expect(inlineLabel).toContainText('復習だけ');
  await inlineLabel.click();
  await expect(inlineLabel).toContainText('新規だけ');
  await inlineLabel.click();
  await expect(inlineLabel).toContainText('新規＋復習');
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

  await page.evaluate(() => window.setReviewMode('on'));
  await expect(page.locator('#vocabCard .review-badge')).toBeVisible();
  await expect(page.locator('#questionReasonLabel')).toHaveText('苦手の復習');
  await expect(page.locator('#questionReasonLabel')).toBeVisible();
});

test('復習モードOFFでは新規が出題される', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('vocabGame_skipWelcome', 'true');
  });

  await page.goto('/vocab_clicker_game.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#vocabWord')).not.toContainText('ファイルを読み込んでください');

  await page.evaluate(() => window.setReviewMode('off'));
  await expect(page.locator('#vocabCard .review-badge')).toHaveCount(0);
  await expect(page.locator('#questionReasonLabel')).toBeHidden();
});

test('復習スコアは予定復習の正解に加点し送信用eventIdを作る', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('vocabGame_skipWelcome', 'true');
    localStorage.setItem('vocabGame_disableAutoUpdate', 'true');
  });

  await page.goto('/vocab_clicker_game.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#vocabWord')).not.toContainText('ファイルを読み込んでください');

  const result = await page.evaluate(() => {
    const gs = window.gameState;
    const word = gs.currentWord;
    const key = window.getWordKeySafe(word, word.__sourceLevel || gs.currentLevel);
    gs.reviewScore = { total: 0, date: null, todayPoints: 0, todayReviewed: 0, todayCorrect: 0, history: {} };
    gs.srsData[key] = { ...(gs.srsData[key] || {}), scheduledIntervalDays: 7, isRelearning: false };
    gs.wordStates[key] = 'weak';
    gs.currentQuestionReason = 'due-weak';
    const points = window.awardReviewScore(key, true, 7);
    const event = gs.reviewScore.pendingEvents[0];
    return {
      points,
      todayPoints: gs.reviewScore.todayPoints,
      total: gs.reviewScore.total,
      todayReviewed: gs.reviewScore.todayReviewed,
      todayCorrect: gs.reviewScore.todayCorrect,
      outcome: event.outcome,
      eventId: event.eventId,
      hasCycleId: Object.prototype.hasOwnProperty.call(event, 'cycleId'),
    };
  });

  expect(result).toMatchObject({
    points: 4,
    todayPoints: 4,
    total: 4,
    todayReviewed: 1,
    todayCorrect: 1,
    outcome: 'scheduled-correct',
    hasCycleId: false,
  });
  expect(result.eventId).toMatch(/^[a-zA-Z0-9._-]{8,96}$/);
});

test('復習は不正解ごとに1点、5分再学習の正解で2点', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('vocabGame_skipWelcome', 'true');
    localStorage.setItem('vocabGame_disableAutoUpdate', 'true');
  });

  await page.goto('/vocab_clicker_game.html', { waitUntil: 'domcontentloaded' });

  const result = await page.evaluate(() => {
    const gs = window.gameState;
    const word = gs.currentWord;
    const key = window.getWordKeySafe(word, word.__sourceLevel || gs.currentLevel);
    gs.reviewScore = { total: 0, date: null, todayPoints: 0, todayReviewed: 0, todayCorrect: 0, history: {} };
    gs.srsData[key] = { dueAt: Date.now() - 1000, scheduledIntervalDays: 30, isRelearning: false };
    gs.currentQuestionReason = 'due-weak';

    const firstIncorrect = window.awardReviewScore(key, false, 30);
    window.updateSrsForWord(key, false, 'weak');
    gs.srsData[key].dueAt = Date.now() - 1000;
    const repeatedIncorrect = window.awardReviewScore(key, false, 30);
    window.updateSrsForWord(key, false, 'weak');
    gs.srsData[key].dueAt = Date.now() - 1000;
    const recoveryCorrect = window.awardReviewScore(key, true, 1);
    window.updateSrsForWord(key, true, 'weak');

    return {
      firstIncorrect,
      repeatedIncorrect,
      recoveryCorrect,
      total: gs.reviewScore.todayPoints,
      reviewed: gs.reviewScore.todayReviewed,
      outcomes: gs.reviewScore.pendingEvents.map((event) => event.outcome),
      isRelearning: gs.srsData[key].isRelearning,
    };
  });

  expect(result).toEqual({
    firstIncorrect: 1,
    repeatedIncorrect: 1,
    recoveryCorrect: 2,
    total: 4,
    reviewed: 3,
    outcomes: ['incorrect', 'incorrect', 'relearning-correct'],
    isRelearning: false,
  });
});

test('予定復習の正解はSRS間隔に応じて3点から7点', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('vocabGame_skipWelcome', 'true');
    localStorage.setItem('vocabGame_disableAutoUpdate', 'true');
  });

  await page.goto('/vocab_clicker_game.html', { waitUntil: 'domcontentloaded' });

  const points = await page.evaluate(() => {
    const gs = window.gameState;
    gs.reviewScore = { total: 0, date: null, todayPoints: 0, todayReviewed: 0, todayCorrect: 0, history: {} };
    gs.currentQuestionReason = 'due-learned';
    return [1, 3, 7, 14, 30, 60].map((interval, index) => (
      window.awardReviewScore(`score-cycle-test-${index}`, true, interval)
    ));
  });

  expect(points).toEqual([3, 3, 4, 5, 6, 7]);
});

test('旧SRSの得意・完璧単語は状態に合う復習間隔へ移行する', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('vocabGame_skipWelcome', 'true');
    localStorage.setItem('vocabGame_disableAutoUpdate', 'true');
  });

  await page.goto('/vocab_clicker_game.html', { waitUntil: 'domcontentloaded' });

  const result = await page.evaluate(() => {
    const gs = window.gameState;
    gs.srsSchemaVersion = 3;
    gs.wordStates.migrationPerfect = 'perfect';
    gs.wordStates.migrationLearned = 'learned';
    gs.wordStates.migrationRelearning = 'weak';
    gs.srsData.migrationPerfect = { dueAt: Date.now() + 1000, successCount: 1, failCount: 0 };
    gs.srsData.migrationLearned = { dueAt: Date.now() + 1000, successCount: 1, failCount: 1 };
    gs.srsData.migrationRelearning = {
      dueAt: Date.now() + 5 * 60 * 1000,
      lastReviewedAt: Date.now(),
      successCount: 0,
      failCount: 1,
      reviewScoreCycleId: 'legacy-cycle',
      reviewScoreCycleResolved: false,
    };

    window.migrateSrsSchemaIfNeeded();
    return {
      version: gs.srsSchemaVersion,
      perfect: {
        step: gs.srsData.migrationPerfect.reviewStep,
        interval: gs.srsData.migrationPerfect.scheduledIntervalDays,
      },
      learned: {
        step: gs.srsData.migrationLearned.reviewStep,
        interval: gs.srsData.migrationLearned.scheduledIntervalDays,
      },
      relearning: {
        active: gs.srsData.migrationRelearning.isRelearning,
        hasLegacyCycle: Object.prototype.hasOwnProperty.call(gs.srsData.migrationRelearning, 'reviewScoreCycleId'),
      },
    };
  });

  expect(result).toEqual({
    version: 5,
    perfect: { step: 5, interval: 30 },
    learned: { step: 2, interval: 3 },
    relearning: { active: true, hasLegacyCycle: false },
  });
});

test('SRSの揺らぎを正規間隔へ丸めて復習スコアを記録する', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('vocabGame_skipWelcome', 'true');
    localStorage.setItem('vocabGame_disableAutoUpdate', 'true');
  });

  await page.goto('/vocab_clicker_game.html', { waitUntil: 'domcontentloaded' });

  const result = await page.evaluate(() => {
    const gs = window.gameState;
    const word = gs.currentWord;
    const key = window.getWordKeySafe(word, word.__sourceLevel || gs.currentLevel);
    gs.reviewScore = { total: 0, date: null, todayPoints: 0, todayReviewed: 0, todayCorrect: 0, history: {} };
    gs.srsData[key] = { ...(gs.srsData[key] || {}) };
    delete gs.srsData[key].lastReviewScoreDate;
    gs.currentQuestionReason = 'due-learned';

    const points = window.awardReviewScore(key, true, 26);
    return {
      points,
      interval: gs.reviewScore.pendingEvents[0].previousIntervalDays,
    };
  });

  expect(result).toEqual({ points: 6, interval: 30 });
});

test('大型アップデートは初回だけ自動表示し、あとで閉じても未読を維持する', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('vocabGame_skipWelcome', 'true');
    localStorage.setItem('vocabGame_disableAutoUpdate', 'true');
  });

  await page.goto('/vocab_clicker_game.html?announcementPreview=1', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#announcementModal')).toBeVisible();
  await expect(page.locator('#announcementModal')).toHaveClass(/is-featured-mode/);
  await expect(page.locator('#announcementHeading')).toHaveText('大型アップデート');
  await expect(page.locator('#announcementList')).toContainText('新ランキングシステム、導入！');
  await expect(page.locator('.announcement-feature-visual')).toBeVisible();
  await expect(page.locator('.announcement-feature-visual')).toHaveAttribute('src', 'assets/review-ranking-update.png');
  await expect(page.locator('#announcementList')).toContainText('ランキングを競おう');
  await expect(page.locator('#announcementPrimaryAction')).toHaveText('ランキングを見る');

  await page.locator('.announcement-secondary-action').click();
  await expect(page.locator('#announcementModal')).toBeHidden();
  await expect(page.locator('#announcementUnreadDot')).toBeVisible();

  await page.locator('#announcementBtn').click();
  await expect(page.locator('#announcementHeading')).toHaveText('お知らせ');
  await expect(page.locator('#announcementModal')).not.toHaveClass(/is-featured-mode/);
  await expect(page.locator('.announcement-feature-visual')).toHaveCount(0);
  await expect(page.locator('#announcementUnreadDot')).toBeHidden();
});

test('大型アップデート画像はiPhone SE幅でも操作可能な範囲に収まる', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.addInitScript(() => {
    localStorage.setItem('vocabGame_skipWelcome', 'true');
    localStorage.setItem('vocabGame_disableAutoUpdate', 'true');
  });

  await page.goto('/vocab_clicker_game.html?announcementPreview=1', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#announcementModal')).toBeVisible();
  await expect(page.locator('.announcement-feature-visual')).toBeVisible();
  await expect(page.locator('#announcementPrimaryAction')).toBeVisible();
  await expect(page.locator('.announcement-secondary-action')).toBeVisible();

  const bounds = await page.locator('.announcement-modal-content').boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.y).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(375);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(667);
});

test('期限前の手動学習は復習スコアに加点せず不正解の予定復習は1点', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('vocabGame_skipWelcome', 'true');
    localStorage.setItem('vocabGame_disableAutoUpdate', 'true');
  });

  await page.goto('/vocab_clicker_game.html', { waitUntil: 'domcontentloaded' });

  const result = await page.evaluate(() => {
    const gs = window.gameState;
    const word = gs.currentWord;
    const key = window.getWordKeySafe(word, word.__sourceLevel || gs.currentLevel);
    gs.reviewScore = { total: 0, date: null, todayPoints: 0, todayReviewed: 0, todayCorrect: 0, history: {} };
    gs.srsData[key] = { ...(gs.srsData[key] || {}) };
    delete gs.srsData[key].lastReviewScoreDate;

    gs.currentQuestionReason = 'manual-weak';
    const manual = window.awardReviewScore(key, true, 30);
    gs.currentQuestionReason = 'due-weak';
    const incorrect = window.awardReviewScore(key, false, 30);
    return { manual, incorrect, todayPoints: gs.reviewScore.todayPoints };
  });

  expect(result).toEqual({ manual: 0, incorrect: 1, todayPoints: 1 });
});

test('期限到来済みの苦手語は苦手ゾーンから出題しても復習扱いになる', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('vocabGame_skipWelcome', 'true');
    localStorage.setItem('vocabGame_disableAutoUpdate', 'true');
  });

  await page.goto('/vocab_clicker_game.html', { waitUntil: 'domcontentloaded' });

  const result = await page.evaluate(() => {
    const gs = window.gameState;
    const target = window.vocabulary[0];
    const level = target.__sourceLevel || gs.currentLevel;
    const targetKey = window.getWordKeySafe(target, level);

    window.vocabulary.forEach((word) => {
      const wordLevel = word.__sourceLevel || gs.currentLevel;
      gs.wordStates[window.getWordKeySafe(word, wordLevel)] = 'unlearned';
    });
    gs.wordStates[targetKey] = 'weak';
    gs.srsData[targetKey] = {
      ...(gs.srsData[targetKey] || {}),
      dueAt: Date.now() - 1000,
      scheduledIntervalDays: 3,
      isRelearning: false,
    };
    gs.currentMode = 'weak';
    gs.decks = null;

    window.showNextWord();

    return {
      targetKey,
      wordKey: window.getWordKeySafe(gs.currentWord, gs.currentWord.__sourceLevel || gs.currentLevel),
      reason: gs.currentQuestionReason,
      isReviewWord: gs.isReviewWord,
    };
  });

  expect(result.wordKey).toBe(result.targetKey);
  expect(result.reason).toBe('due-weak');
  expect(result.isReviewWord).toBe(true);
});

test('クールタイム中の苦手語を単語一覧から開いても復習スコアに加点しない', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('vocabGame_skipWelcome', 'true');
    localStorage.setItem('vocabGame_disableAutoUpdate', 'true');
  });

  await page.goto('/vocab_clicker_game.html', { waitUntil: 'domcontentloaded' });

  const result = await page.evaluate(() => {
    const gs = window.gameState;
    const word = gs.currentWord;
    const level = word.__sourceLevel || gs.currentLevel;
    const key = window.getWordKeySafe(word, level);
    const resetCooldownWeak = () => {
      gs.wordStates[key] = 'weak';
      gs.srsData[key] = {
        ...(gs.srsData[key] || {}),
        dueAt: Date.now() + (24 * 60 * 60 * 1000),
        scheduledIntervalDays: 3,
      };
      gs.reviewScore = {
        total: 0,
        date: window.getLocalDateKey(),
        todayPoints: 0,
        todayReviewed: 0,
        todayCorrect: 0,
        history: {},
        pendingEvents: [],
      };
      window.openWordFromList(encodeURIComponent(level), encodeURIComponent(key));
    };

    resetCooldownWeak();
    const correctReason = gs.currentQuestionReason;
    window.handleVocabCardClick();
    const correct = {
      points: gs.reviewScore.todayPoints,
      pending: gs.reviewScore.pendingEvents.length,
    };

    resetCooldownWeak();
    const incorrectReason = gs.currentQuestionReason;
    document.getElementById('meaningCard').click();
    const incorrect = {
      points: gs.reviewScore.todayPoints,
      pending: gs.reviewScore.pendingEvents.length,
    };

    return { correctReason, incorrectReason, correct, incorrect };
  });

  expect(result).toEqual({
    correctReason: null,
    incorrectReason: null,
    correct: { points: 0, pending: 0 },
    incorrect: { points: 0, pending: 0 },
  });
});

test('復習回答は即時保存され再起動後にキューへ復活しない', async ({ page }) => {
  await page.goto('/index.html');
  const seeded = await page.evaluate(() => {
    window.gameState.currentLevel = 'junior';
    window.gameState.currentMode = 'unlearned';
    window.gameState.reviewMode = 'on';
    window.gameState.activeReviewLevels = ['junior'];

    const words = window.vocabularyDatabase.junior.slice(0, 3);
    const keys = words.map((word, index) => {
      const key = window.GameUtils.getWordKey(word, 'junior', window.vocabularyDatabase);
      window.gameState.wordStates[key] = 'weak';
      window.gameState.srsData[key] = {
        dueAt: Date.now() - 3000 + index,
        stability: 1,
        successCount: 0,
        failCount: 1,
        streak: 0,
        lastReviewedAt: Date.now() - 86400000,
        reviewStep: 0,
        scheduledIntervalDays: 1,
        isRelearning: false,
        everWrong: true,
        firstTryPerfect: false,
      };
      return key;
    });
    window.saveGame();
    return { keys, firstWord: words[0].word };
  });

  await page.reload();
  await expect.poll(() => page.evaluate(() => window.gameState?.currentWord?.word || null)).toBe(seeded.firstWord);

  const afterAnswers = await page.evaluate((expectedKeys) => {
    return expectedKeys.map(() => {
      const currentWord = window.gameState.currentWord;
      const key = window.GameUtils.getWordKey(
        currentWord,
        currentWord.__sourceLevel || window.gameState.currentLevel,
        window.vocabularyDatabase
      );
      window.handleVocabCardClick();
      const saved = JSON.parse(localStorage.getItem('vocabClickerSave'));
      return {
        key,
        memoryState: window.gameState.wordStates[key],
        savedState: saved.wordStates[key],
        memoryDueAt: window.gameState.srsData[key].dueAt,
        savedDueAt: saved.srsData[key].dueAt,
      };
    });
  }, seeded.keys);

  expect(afterAnswers.map(answer => answer.key).sort()).toEqual([...seeded.keys].sort());
  afterAnswers.forEach(answer => {
    expect(answer.savedState).toBe(answer.memoryState);
    expect(answer.savedDueAt).toBe(answer.memoryDueAt);
    expect(answer.savedDueAt).toBeGreaterThan(Date.now());
  });

  await page.reload();
  const afterReload = await page.evaluate((keys) => {
    const queueKeys = window.buildReviewQueueSnapshot().dueWords.map(word => (
      window.GameUtils.getWordKey(
        word,
        word.__sourceLevel || window.gameState.currentLevel,
        window.vocabularyDatabase
      )
    ));
    return {
      states: keys.map(key => window.gameState.wordStates[key]),
      dueAtValues: keys.map(key => window.gameState.srsData[key].dueAt),
      queueKeys,
    };
  }, seeded.keys);

  expect(afterReload.states).toEqual(afterAnswers.map(answer => answer.memoryState));
  expect(afterReload.dueAtValues).toEqual(afterAnswers.map(answer => answer.memoryDueAt));
  seeded.keys.forEach(key => expect(afterReload.queueKeys).not.toContain(key));
});

test('端末保存は未学習の初期値を省略し復習履歴を保持する', async ({ page }) => {
  await page.goto('/index.html');
  const result = await page.evaluate(() => {
    const untouchedWord = window.vocabularyDatabase.junior[0];
    const reviewedWord = window.vocabularyDatabase.junior[1];
    const untouchedKey = window.GameUtils.getWordKey(
      untouchedWord,
      'junior',
      window.vocabularyDatabase
    );
    const reviewedKey = window.GameUtils.getWordKey(
      reviewedWord,
      'junior',
      window.vocabularyDatabase
    );

    window.gameState.wordStates[untouchedKey] = 'unlearned';
    window.gameState.srsData[untouchedKey] = {
      dueAt: Date.now(),
      stability: 1,
      successCount: 0,
      failCount: 0,
      streak: 0,
      lastReviewedAt: 0,
      reviewStep: 0,
      scheduledIntervalDays: 1,
      isRelearning: false,
      everWrong: false,
      firstTryPerfect: false,
    };
    window.gameState.wordStates[reviewedKey] = 'weak';
    window.gameState.srsData[reviewedKey] = {
      dueAt: Date.now() + 300000,
      stability: 0.6,
      successCount: 0,
      failCount: 1,
      streak: 0,
      lastReviewedAt: Date.now(),
      reviewStep: 0,
      scheduledIntervalDays: 1,
      isRelearning: true,
      everWrong: true,
      firstTryPerfect: false,
    };

    const saveSucceeded = window.saveGame();
    const saved = JSON.parse(localStorage.getItem('vocabClickerSave'));
    return {
      saveSucceeded,
      untouchedKey,
      reviewedKey,
      memoryHasUntouched: Object.hasOwn(window.gameState.srsData, untouchedKey),
      savedUntouchedState: saved.wordStates[untouchedKey],
      savedUntouchedSrs: saved.srsData[untouchedKey],
      savedReviewedState: saved.wordStates[reviewedKey],
      savedReviewedSrs: saved.srsData[reviewedKey],
      localCompactVersion: saved.localCompactVersion,
    };
  });

  expect(result.saveSucceeded).toBe(true);
  expect(result.localCompactVersion).toBe(1);
  expect(result.memoryHasUntouched).toBe(true);
  expect(result.savedUntouchedState).toBeUndefined();
  expect(result.savedUntouchedSrs).toBeUndefined();
  expect(result.savedReviewedState).toBe('weak');
  expect(result.savedReviewedSrs.failCount).toBe(1);
  expect(result.savedReviewedSrs.isRelearning).toBe(true);
});

test('期限到来済みの苦手語は単語一覧から開いても復習スコアに加点する', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('vocabGame_skipWelcome', 'true');
    localStorage.setItem('vocabGame_disableAutoUpdate', 'true');
  });

  await page.goto('/vocab_clicker_game.html', { waitUntil: 'domcontentloaded' });

  const result = await page.evaluate(() => {
    const gs = window.gameState;
    const word = gs.currentWord;
    const level = word.__sourceLevel || gs.currentLevel;
    const key = window.getWordKeySafe(word, level);
    gs.wordStates[key] = 'weak';
    gs.srsData[key] = {
      ...(gs.srsData[key] || {}),
      dueAt: Date.now() - 1000,
      scheduledIntervalDays: 3,
      isRelearning: false,
    };
    gs.reviewScore = {
      total: 0,
      date: window.getLocalDateKey(),
      todayPoints: 0,
      todayReviewed: 0,
      todayCorrect: 0,
      history: {},
      pendingEvents: [],
    };

    window.openWordFromList(encodeURIComponent(level), encodeURIComponent(key));
    const reason = gs.currentQuestionReason;
    const isReviewWord = gs.isReviewWord;
    window.handleVocabCardClick();

    return {
      reason,
      isReviewWord,
      points: gs.reviewScore.todayPoints,
      pending: gs.reviewScore.pendingEvents.length,
    };
  });

  expect(result).toEqual({
    reason: 'due-weak',
    isReviewWord: true,
    points: 3,
    pending: 1,
  });
});

test('ホームに今日と週の復習スコア、キューに明日の予定件数を表示する', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('vocabGame_skipWelcome', 'true');
    localStorage.setItem('vocabGame_disableAutoUpdate', 'true');
  });

  await page.goto('/vocab_clicker_game.html', { waitUntil: 'domcontentloaded' });

  await page.evaluate(() => {
    const gs = window.gameState;
    const word = gs.currentWord;
    const key = window.getWordKeySafe(word, word.__sourceLevel || gs.currentLevel);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(12, 0, 0, 0);
    gs.wordStates[key] = 'weak';
    gs.srsData[key] = { ...(gs.srsData[key] || {}), dueAt: tomorrow.getTime() };
    gs.reviewScore = {
      total: 12,
      date: window.getLocalDateKey(),
      todayPoints: 12,
      todayReviewed: 2,
      todayCorrect: 2,
      history: {
        [window.getLocalDateKey()]: { points: 12, reviewed: 2, correct: 2 },
      },
    };
    window.updateReviewProgressUI();
  });

  await expect(page.locator('#reviewProgressWrap')).toBeVisible();
  await expect(page.locator('#reviewScoreHeaderToday')).toHaveText('12pt');
  await expect(page.locator('#reviewScoreHeaderWeek')).toHaveText('12pt');
  await expect(page.locator('#reviewRankHeader')).toHaveText('--位');
  await expect(page.locator('#reviewTomorrowForecast')).toHaveText('（明日1件）');
  await expect(page.locator('#reviewProgressLabel')).toHaveText(/復習キュー \d+件/);

  const queueToCardsGap = await page.evaluate(() => {
    const queue = document.getElementById('reviewProgressWrap').getBoundingClientRect();
    const cards = document.getElementById('cardsArea').getBoundingClientRect();
    return cards.top - queue.bottom;
  });
  expect(queueToCardsGap).toBeGreaterThanOrEqual(8);
});

test('ログイン中の今日・週ポイントはサーバー確定値と未送信分を合算する', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('vocabGame_skipWelcome', 'true');
    localStorage.setItem('vocabGame_disableAutoUpdate', 'true');
  });

  await page.goto('/vocab_clicker_game.html', { waitUntil: 'domcontentloaded' });
  const result = await page.evaluate(() => {
    Object.defineProperty(window, 'firebaseAuth', {
      configurable: true,
      value: { currentUser: { uid: 'score-sync-user' } },
    });
    const today = window.getLocalDateKey();
    window.gameState.reviewScore = {
      total: 999,
      date: today,
      todayPoints: 999,
      todayReviewed: 1,
      todayCorrect: 1,
      history: {
        [today]: { points: 999, reviewed: 1, correct: 1 },
      },
      pendingEvents: [
        {
          outcome: 'scheduled-correct',
          previousIntervalDays: 7,
          points: 4,
        },
        {
          outcome: 'incorrect',
          previousIntervalDays: 1,
          points: 1,
        },
      ],
    };

    const applied = window.applyServerReviewScore({
      todayKey: today,
      todayPoints: 8,
      weekKey: window.getReviewWeekKey(),
      weekPoints: 20,
      userId: 'score-sync-user',
    });
    const optimisticTodayText = document.getElementById('reviewScoreHeaderToday').textContent;
    const optimisticText = document.getElementById('reviewScoreHeaderWeek').textContent;

    window.gameState.reviewScore.pendingEvents = [];
    window.updateReviewScoreSummary();
    const settledTodayText = document.getElementById('reviewScoreHeaderToday').textContent;
    const settledText = document.getElementById('reviewScoreHeaderWeek').textContent;
    return {
      applied,
      optimisticTodayText,
      optimisticText,
      settledTodayText,
      settledText,
    };
  });

  expect(result).toEqual({
    applied: true,
    optimisticTodayText: '13pt',
    optimisticText: '25pt',
    settledTodayText: '8pt',
    settledText: '20pt',
  });
});

test('旧ゴールド表示を廃止し学習後も互換値を増やさない', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('vocabGame_skipWelcome', 'true');
    localStorage.setItem('vocabGame_disableAutoUpdate', 'true');
  });

  await page.goto('/vocab_clicker_game.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#points')).toHaveCount(0);
  await expect(page.locator('.char-level-display')).toHaveCount(0);

  const result = await page.evaluate(() => {
    window.gameState.points = 321;
    window.gameState.currentQuestionReason = 'manual-unlearned';
    window.gameState.meaningCardFlipped = false;
    window.handleVocabCardClick();
    return window.gameState.points;
  });
  expect(result).toBe(321);
});

test('ランキングプロフィールで犬と猫を含む8種類の実画像アバターを選べる', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('vocabGame_skipWelcome', 'true');
    localStorage.setItem('vocabGame_disableAutoUpdate', 'true');
  });

  await page.goto('/vocab_clicker_game.html', { waitUntil: 'domcontentloaded' });
  const options = page.locator('.review-avatar-option');
  await expect(options).toHaveCount(8);
  await expect(options.locator('img')).toHaveCount(8);
  for (const avatarId of ['dog', 'cat']) {
    const image = page.locator(`.review-avatar-option[data-avatar-id="${avatarId}"] img`);
    await expect.poll(() => image.evaluate(
      (element) => element.complete ? element.naturalWidth : 0
    )).toBe(128);
  }
  await page.locator('#leaderboardModal').evaluate((element) => {
    element.style.display = 'flex';
  });
  await page.locator('#nameInputParams').evaluate((element) => {
    element.style.display = 'block';
  });
  await page.setViewportSize({ width: 1280, height: 800 });
  expect(await page.locator('#reviewAvatarPicker').evaluate(
    (element) => getComputedStyle(element).gridTemplateColumns.split(' ').length
  )).toBe(8);
  await page.setViewportSize({ width: 375, height: 667 });
  expect(await page.locator('#reviewAvatarPicker').evaluate(
    (element) => getComputedStyle(element).gridTemplateColumns.split(' ').length
  )).toBe(4);

  await page.evaluate(async () => {
    window.updateReviewRankingProfile = async () => ({ success: true });
    window.fetchReviewLeaderboard = async () => ({ results: [], me: null });
    document.getElementById('playerNameInput').value = 'テスト';
    window.selectReviewAvatar('dog');
    await window.registerName();
  });

  expect(await page.evaluate(() => localStorage.getItem('vocabGame_reviewAvatarId'))).toBe('dog');
  await expect(page.locator('.review-avatar-option[data-avatar-id="dog"]')).toHaveClass(/active/);
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

test('旧セーブの同綴り語を品詞別キーへ安全に移行する', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('vocabGame_skipWelcome', 'true');
    localStorage.setItem('vocabGame_disableAutoUpdate', 'true');
    localStorage.setItem('vocabClickerSave', JSON.stringify({
      points: 10,
      currentLevel: 'exam1',
      currentMode: 'unlearned',
      wordStates: { exam1_attribute: 'weak' },
      srsData: {
        exam1_attribute: {
          dueAt: 12345,
          successCount: 0,
          failCount: 2,
          reviewStep: 0,
          everWrong: true,
        },
      },
      learnedWordIntervals: { exam1_attribute: 2, exam1_attribute_last: 7 },
      lastSaveTime: Date.now(),
    }));
  });

  await page.goto('/vocab_clicker_game.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => (
    window.gameState &&
    window.vocabularyDatabase &&
    typeof window.getWordKey === 'function' &&
    window.gameState.wordKeySchemaVersion === 2
  ));

  const result = await page.evaluate(() => {
    const entries = window.vocabularyDatabase.exam1.filter(word => word.word === 'attribute');
    const noun = entries.find(word => word.pos === '名');
    const verb = entries.find(word => word.pos === '動');
    const nounKey = window.getWordKey(noun, 'exam1');
    const verbKey = window.getWordKey(verb, 'exam1');
    const before = {
      nounKey,
      verbKey,
      nounState: window.gameState.wordStates[nounKey],
      verbState: window.gameState.wordStates[verbKey],
      nounFails: window.gameState.srsData[nounKey]?.failCount,
      verbFails: window.gameState.srsData[verbKey]?.failCount,
      nounInterval: window.gameState.learnedWordIntervals[nounKey],
      verbInterval: window.gameState.learnedWordIntervals[verbKey],
    };
    window.gameState.wordStates[nounKey] = 'perfect';
    return {
      before,
      nounAfter: window.gameState.wordStates[nounKey],
      verbAfter: window.gameState.wordStates[verbKey],
      schemaVersion: window.gameState.wordKeySchemaVersion,
    };
  });

  expect(result.before.nounKey).not.toBe(result.before.verbKey);
  expect(result.before).toMatchObject({
    nounState: 'weak',
    verbState: 'weak',
    nounFails: 2,
    verbFails: 2,
    nounInterval: 2,
    verbInterval: 2,
  });
  expect(result.nounAfter).toBe('perfect');
  expect(result.verbAfter).toBe('weak');
  expect(result.schemaVersion).toBe(2);
});

test('単語帳参照語は基底語と同じ復習項目として重複しない', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('vocabGame_skipWelcome', 'true');
    localStorage.setItem('vocabGame_disableAutoUpdate', 'true');
  });

  await page.goto('/vocab_clicker_game.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => (
    window.gameState &&
    window.vocabularyDatabase &&
    typeof window.getDueReviewWordsPool === 'function'
  ));

  const result = await page.evaluate(() => {
    const selectionLevel = 'selection1900';
    const selected = window.vocabularyDatabase[selectionLevel]
      .find(word => typeof word.ref === 'string' && word.ref.includes(':'));
    const baseLevel = selected.ref.split(':')[0];
    const key = window.getWordKey(selected, selectionLevel);

    window.gameState.activeReviewLevels = [baseLevel, selectionLevel];
    window.gameState.wordStates[key] = 'weak';
    window.gameState.srsData[key] = {
      dueAt: Date.now() - 1000,
      successCount: 0,
      failCount: 1,
      everWrong: true,
      firstTryPerfect: false,
    };

    const pool = window.getDueReviewWordsPool();
    const matching = pool.filter(word => (
      window.getWordKey(word, word.__sourceLevel || baseLevel) === key
    ));
    return {
      key,
      matchingCount: matching.length,
      meaning: matching[0]?.meaning,
      pos: matching[0]?.pos,
    };
  });

  expect(result.key).toMatch(/^word-v2:/);
  expect(result.matchingCount).toBe(1);
  expect(result.meaning).toBeTruthy();
  expect(result.meaning).not.toBe('（データ準備中）');
  expect(result.pos).not.toBe('unknown');
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

test('ipa がある単語はカード下に表示される', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('vocabGame_skipWelcome', 'true');
  });

  await page.goto('/vocab_clicker_game.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#vocabWord')).not.toContainText('ファイルを読み込んでください');

  const ipaText = await page.evaluate(() => {
    if (!window.vocabularyDatabase || typeof window.showWord !== 'function') return null;
    const word = (window.vocabularyDatabase.basic || []).find((item) => item.word === 'ability' && item.pos === '名');
    if (!word || !word.ipa) return null;
    if (window.gameState) {
      window.gameState.currentWord = word;
    }
    window.showWord(word);
    return `/${word.ipa}/`;
  });

  expect(ipaText).not.toBeNull();
  await expect(page.locator('#vocabWord .word-ipa')).toHaveText(ipaText);
});

test('junior(A1) の ipa がカード下に表示される', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('vocabGame_skipWelcome', 'true');
  });

  await page.goto('/vocab_clicker_game.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#vocabWord')).not.toContainText('ファイルを読み込んでください');

  const ipaText = await page.evaluate(() => {
    if (!window.vocabularyDatabase || typeof window.showWord !== 'function') return null;
    const word = (window.vocabularyDatabase.junior || []).find((item) => item.word === 'read' && item.pos === '動');
    if (!word || !word.ipa) return null;
    if (window.gameState) {
      window.gameState.currentLevel = 'junior';
      window.gameState.currentWord = word;
    }
    window.showWord(word);
    return `/${word.ipa}/`;
  });

  expect(ipaText).toBe('/rid/');
  await expect(page.locator('#vocabWord .word-ipa')).toHaveText('/rid/');
});

test('daily(B1) の ipa がカード下に表示される', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('vocabGame_skipWelcome', 'true');
  });

  await page.goto('/vocab_clicker_game.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#vocabWord')).not.toContainText('ファイルを読み込んでください');

  const ipaText = await page.evaluate(() => {
    if (!window.vocabularyDatabase || typeof window.showWord !== 'function') return null;
    const word = (window.vocabularyDatabase.daily || []).find((item) => item.word === 'upload' && item.pos === '動');
    if (!word || !word.ipa) return null;
    if (window.gameState) {
      window.gameState.currentLevel = 'daily';
      window.gameState.currentWord = word;
    }
    window.showWord(word);
    return `/${word.ipa}/`;
  });

  expect(ipaText).toBe('/ʌpˈloʊd/');
  await expect(page.locator('#vocabWord .word-ipa')).toHaveText('/ʌpˈloʊd/');
});

test('exam1(B2) の ipa がカード下に表示される', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('vocabGame_skipWelcome', 'true');
  });

  await page.goto('/vocab_clicker_game.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#vocabWord')).not.toContainText('ファイルを読み込んでください');

  const ipaText = await page.evaluate(() => {
    if (!window.vocabularyDatabase || typeof window.showWord !== 'function') return null;
    const word = (window.vocabularyDatabase.exam1 || []).find((item) => item.word === 'attribute' && item.pos === '動');
    if (!word || !word.ipa) return null;
    if (window.gameState) {
      window.gameState.currentLevel = 'exam1';
      window.gameState.currentWord = word;
    }
    window.showWord(word);
    return `/${word.ipa}/`;
  });

  expect(ipaText).toBe('/əˈtrɪbjut/');
  await expect(page.locator('#vocabWord .word-ipa')).toHaveText('/əˈtrɪbjut/');
});

test('selection1900 の直接 ipa がカード下に表示される', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('vocabGame_skipWelcome', 'true');
  });

  await page.goto('/vocab_clicker_game.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#vocabWord')).not.toContainText('ファイルを読み込んでください');

  const ipaText = await page.evaluate(() => {
    if (!window.vocabularyDatabase || typeof window.showWord !== 'function') return null;
    const word = (window.vocabularyDatabase.selection1900 || []).find((item) => item.word === 'technology');
    if (!word || !word.ipa) return null;
    if (window.gameState) {
      window.gameState.currentLevel = 'selection1900';
      window.gameState.currentWord = word;
    }
    window.showWord(word);
    return `/${word.ipa}/`;
  });

  expect(ipaText).toBe('/tekˈnɑlədʒi/');
  await expect(page.locator('#vocabWord .word-ipa')).toHaveText('/tekˈnɑlədʒi/');
});

test('sys_2000 の直接 ipa がカード下に表示される', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('vocabGame_skipWelcome', 'true');
  });

  await page.goto('/vocab_clicker_game.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#vocabWord')).not.toContainText('ファイルを読み込んでください');

  const ipaText = await page.evaluate(() => {
    if (!window.vocabularyDatabase || typeof window.showWord !== 'function') return null;
    const word = (window.vocabularyDatabase.sys_2000 || []).find((item) => item.word === 'sight');
    if (!word || !word.ipa) return null;
    if (window.gameState) {
      window.gameState.currentLevel = 'sys_2000';
      window.gameState.currentWord = word;
    }
    window.showWord(word);
    return `/${word.ipa}/`;
  });

  expect(ipaText).toBe('/saɪt/');
  await expect(page.locator('#vocabWord .word-ipa')).toHaveText('/saɪt/');
});

test('公開版の version.js が新しければ更新ありと判定する', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('vocabGame_skipWelcome', 'true');
    localStorage.setItem('vocabGame_disableAutoUpdate', 'true');
  });

  await page.route(/\/js\/version\.js\?update-check=/, async (route) => {
    await route.fulfill({
      contentType: 'application/javascript',
      body: '(function (global) { global.GAME_VERSION = "9999.1231.2359"; })(window);',
    });
  });

  await page.goto('/vocab_clicker_game.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#vocabWord')).not.toContainText('ファイルを読み込んでください');

  const hasUpdate = await page.evaluate(async () => {
    if (!window.appUpdateManager) return null;
    return window.appUpdateManager.checkForUpdates();
  });

  expect(hasUpdate).toBe(true);

  const comparisons = await page.evaluate(() => ({
    timestampOrder: window.appUpdateManager.compareVersions('2026.0710.0839', '2026.0710.0838'),
    legacyMigration: window.appUpdateManager.compareVersions('2026.0710.0838', 'v3.28'),
  }));
  expect(comparisons.timestampOrder).toBe(1);
  expect(comparisons.legacyMigration).toBe(1);
});

test('selection1900 の参照番号は意味カードに表示しない', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('vocabGame_skipWelcome', 'true');
  });

  await page.goto('/vocab_clicker_game.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#vocabWord')).not.toContainText('ファイルを読み込んでください');

  const found = await page.evaluate(() => {
    if (!window.vocabularyDatabase || typeof window.showWord !== 'function') return false;
    const word = (window.vocabularyDatabase.selection1900 || []).find((item) => item.word === 'voluntary');
    if (!word) return false;
    if (window.gameState) {
      window.gameState.currentLevel = 'selection1900';
      window.gameState.currentWord = word;
    }
    window.showWord(word);
    return true;
  });

  expect(found).toBe(true);
  await expect(page.locator('#meaningText')).toContainText('自発的な');
  await expect(page.locator('#meaningText')).toContainText('無償の');
  await expect(page.locator('#meaningText')).not.toContainText('1384');
  await expect(page.locator('#meaningText')).not.toContainText('compulsory');
});

test('英単語一覧から検索して単語カードへ移動できる', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('vocabGame_skipWelcome', 'true');
    localStorage.setItem('vocabGame_disableAutoUpdate', 'true');
    localStorage.setItem('vocabGame_wordListShowMeaning', 'false');
  });

  await page.goto('/vocab_clicker_game.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#vocabWord')).not.toContainText('ファイルを読み込んでください');

  await page.evaluate(() => window.openWordListModal());
  await expect(page.locator('#wordListModal')).toBeVisible();
  await expect(page.locator('#wordListGrid .word-list-card').first()).toBeVisible();
  await expect(page.locator('#wordListMeaningState')).toHaveText('OFF');

  const desktopGeometry = await page.locator('#wordListGrid').evaluate((grid) => {
    const card = grid.querySelector('.word-list-card');
    return {
      columns: getComputedStyle(grid).gridTemplateColumns.split(' ').length,
      cardRadius: getComputedStyle(card).borderRadius,
      stateBarRadius: getComputedStyle(card, '::before').borderRadius,
    };
  });
  expect(desktopGeometry).toEqual({ columns: 5, cardRadius: '0px', stateBarRadius: '0px' });

  await page.locator('#wordListAlphaButton').click();
  await expect(page.locator('#wordListAlphabet')).toBeVisible();
  await page.getByRole('button', { name: 'B', exact: true }).click();
  await expect(page.locator('#wordListPosition')).toContainText('B');

  await page.setViewportSize({ width: 390, height: 844 });
  const mobileColumns = await page.locator('#wordListGrid').evaluate(
    (grid) => getComputedStyle(grid).gridTemplateColumns.split(' ').length
  );
  expect(mobileColumns).toBe(2);

  await page.locator('#wordListSearchToggle').click();
  await page.locator('#wordListSearchInput').fill('ability');
  await expect(page.locator('#wordListGrid .word-list-card').first()).toContainText('ability');

  await page.locator('#wordListGrid .word-list-card').first().click();
  await expect(page.locator('#wordListModal')).toBeHidden();
  await expect(page.locator('#vocabWord')).toContainText('ability');
});
