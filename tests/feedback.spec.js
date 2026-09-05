const { test, expect } = require('@playwright/test');
test.beforeEach(async ({ page }) => {
    await page.route('**/*cloudfunctions.net/feedback', route => route.fulfill({ json: { items: [] } }));
});
test('未ログイン閲覧と閉じる操作', async ({ page }) => {
    await page.goto('/index.html');
    await page.evaluate(() => window.openFeedback());
    await expect(page.locator('#feedbackModal')).toBeVisible();
    await expect(page.locator('#feedbackLogin')).toBeVisible();
    await expect(page.locator('#feedbackList')).toContainText('まだ投稿はありません');
    await page.keyboard.press('Escape');
    await expect(page.locator('#feedbackModal')).toBeHidden();
    await page.evaluate(() => window.openFeedback());
    await page.locator('#feedbackClose').click();
    await expect(page.locator('#feedbackModal')).toBeHidden();
});
test('ひとこと欄は背景と戻るで閉じる', async ({ page }) => {
    await page.goto('/index.html');
    await page.evaluate(() => window.openFeedback());
    await expect(page.locator('#feedbackModal')).toBeVisible();
    await page.locator('#feedbackModal').click({ position: { x: 2, y: 2 } });
    await expect(page.locator('#feedbackModal')).toBeHidden();
    await page.evaluate(() => window.openFeedback());
    await expect(page.locator('#feedbackModal')).toBeVisible();
    await expect.poll(() => page.evaluate(() => !dismissibleModalState.cleaningHistory && window.history.state?.__teniohaModalLayer === true)).toBe(true);
    await page.goBack();
    await expect(page.locator('#feedbackModal')).toBeHidden();
    expect(page.url()).toContain('/index.html');
});
test('投稿・返信の表示は安全なテキスト、Google実名は初期入力しない', async ({ page }) => {
    await page.goto('/index.html');
    await page.evaluate(() => { window.firebaseAuth = { currentUser: { isAnonymous: false, displayName: 'PRIVATE NAME', getIdToken: async () => 'test' } }; });
    let created;
    await page.route('**/*cloudfunctions.net/feedback', async route => {
        const body = route.request().postDataJSON();
        if (body.action === 'create') { created = body; return route.fulfill({ json: { ok: true } }); }
        return route.fulfill({ json: { items: [{ id: 'a', nickname: '利用者', text: '<img src=x onerror=alert(1)>', reply: '確認しました', createdAt: 1, mine: false }] } });
    });
    await page.evaluate(() => window.openFeedback());
    await expect(page.locator('#feedbackForm')).toBeVisible();
    await expect(page.locator('#feedbackNickname')).toHaveValue('');
    await expect(page.locator('#feedbackList img')).toHaveCount(0);
    await expect(page.locator('#feedbackList')).toContainText('確認しました');
    await page.locator('#feedbackText').fill('復習機能を改善してほしい');
    await page.locator('#feedbackSubmit').click();
    await expect(page.locator('#feedbackText')).toHaveValue('');
    expect(created.nickname).toBe('学習者');
    await page.locator('.feedback-post .feedback-text').first().evaluate(el => { el.textContent = '復習の順番を選べると嬉しいです。（表示確認用）'; });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: 'screenshots/feedback-mobile.png' });
});
test('通信失敗時に入力を消さず再試行できる', async ({ page }) => {
    await page.goto('/index.html');
    await page.evaluate(() => { window.firebaseAuth = { currentUser: { isAnonymous: false, getIdToken: async () => 'test' } }; window.openFeedback(); });
    await page.route('**/*cloudfunctions.net/feedback', route => route.fulfill({ status: 503, json: { error: '一時的に利用できません' } }));
    await page.locator('#feedbackText').fill('消さないで');
    await page.locator('#feedbackSubmit').click();
    await expect(page.locator('#feedbackMessage')).toContainText('利用できません');
    await expect(page.locator('#feedbackText')).toHaveValue('消さないで');
    await expect(page.locator('#feedbackSubmit')).toBeEnabled();
});

test('ひとこと欄の返信履歴・投稿者の追加返信・下書き保持', async ({ page }) => {
    await page.goto('/index.html');
    await page.evaluate(() => { window.firebaseAuth = { currentUser: { isAnonymous: false, getIdToken: async () => 'test' } }; });
    const post = { id: 'thread', nickname: '利用者（表示例）', text: '復習をランダムにしたいです。', createdAt: Date.now(), mine: true, status: 'done', thread: [
        { role: 'operator', text: 'ご要望ありがとうございます。追加を予定しています。', createdAt: Date.now() - 3600000 },
        { role: 'operator', text: '実装しました。ありがとうございます！', createdAt: Date.now() - 1800000 },
        { role: 'status', status: 'done', createdAt: Date.now() - 1800000 }
    ] };
    let failure = true;
    await page.route('**/*cloudfunctions.net/feedback', route => {
        const body = route.request().postDataJSON();
        if (body.action === 'comment') {
            if (failure) return route.fulfill({ status: 503, json: { error: '一時的なエラー' } });
            post.thread.push({ role: 'author', text: body.text, createdAt: Date.now() });
            return route.fulfill({ json: { ok: true } });
        }
        return route.fulfill({ json: { items: [post], isAdmin: false } });
    });
    await page.evaluate(() => window.openFeedback());
    await expect(page.locator('.feedback-reply')).toHaveCount(2);
    await expect(page.locator('.feedback-status').first()).toHaveText('対応済み');
    await expect(page.locator('.feedback-status-tools')).toHaveCount(0);
    await page.getByText('追加でひとこと返す', { exact: true }).click();
    const field = page.getByRole('textbox', { name: /投稿への追加コメント/ });
    await field.fill('早い対応ありがとうございます！');
    await page.getByRole('button', { name: '公開で返信する' }).click();
    await expect(page.locator('#feedbackMessage')).toHaveText('一時的なエラー');
    await expect(field).toHaveValue('早い対応ありがとうございます！');
    await page.locator('#feedbackRefresh').click();
    await expect(field).toHaveValue('早い対応ありがとうございます！');
    failure = false;
    await page.getByRole('button', { name: '公開で返信する' }).click();
    await expect(page.locator('.feedback-author-reply')).toContainText('早い対応ありがとうございます！');
    await expect(page.locator('.feedback-reply')).toHaveCount(2);
    await page.locator('.feedback-post').screenshot({ path: 'screenshots/feedback-thread.png' });
});

test('運営の返信は空欄から追記し、状態変更は別の操作で送る', async ({ page }) => {
    await page.goto('/index.html');
    await page.evaluate(() => { window.firebaseAuth = { currentUser: { isAnonymous: false, getIdToken: async () => 'test' } }; });
    const requests = [];
    await page.route('**/*cloudfunctions.net/feedback', route => {
        const body = route.request().postDataJSON();
        if (body.action !== 'list') requests.push(body);
        return route.fulfill({ json: { ok: true, isAdmin: true, items: [{ id: 'a', text: '要望', nickname: '利用者', createdAt: 1, status: 'reviewing', thread: [{ role: 'operator', text: '古い返信', createdAt: 1 }] }] } });
    });
    await page.evaluate(() => window.openFeedback());
    await page.getByText('運営として返信する', { exact: true }).click();
    const field = page.getByRole('textbox', { name: /投稿への運営返信/ });
    await expect(field).toHaveValue('');
    await field.fill('新しい返信');
    await page.getByRole('button', { name: '公開で返信する' }).click();
    await expect.poll(() => requests.length).toBe(1);
    expect(requests[0]).toMatchObject({ action: 'reply', text: '新しい返信' });
    await expect(page.locator('#feedbackSubmit')).toBeEnabled();
    await page.getByRole('combobox').selectOption('done');
    await page.getByRole('button', { name: '対応状況を変更' }).click();
    await expect.poll(() => requests.length).toBe(2);
    expect(requests[1]).toMatchObject({ action: 'status', status: 'done' });
});
