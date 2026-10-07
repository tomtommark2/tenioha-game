const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page, baseURL }) => {
    const origin = new URL(baseURL).origin;
    await page.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
    await page.addInitScript(() => {
        localStorage.setItem('vocabGame_skipWelcome', 'true');
        localStorage.setItem('vocabGame_disableAutoUpdate', 'true');
        localStorage.setItem('vocabGame_installGuideDismissed', 'true');
        localStorage.setItem('vocabGame_lastAutoShownAnnouncementId', '2026-10-04-noun-illustrations-complete');
    });
    await page.goto('/index.html');
    await expect(page.locator('#vocabWord')).toHaveText('クリックしてスタート');
});

test('マイ単語帳：M3Eの一覧と固定操作は320〜1280pxで収まり保存形式を維持', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.locator('#levelCurrentBtn').click();
    await page.locator('#wordbookBtn').click();
    await expect(page.locator('#wordbookPickerTitle')).toHaveText('単語帳を選択');
    const picker = await page.locator('#wordbookModal .wordbook-modal-content').evaluate(node => ({ height: node.clientHeight, contentHeight: node.scrollHeight }));
    expect(picker.contentHeight).toBeLessThanOrEqual(picker.height);
    expect(await page.locator('#myWordbookOpener .wordbook-copy small').evaluate(node => getComputedStyle(node).fontWeight)).toBe('400');
    await page.locator('#myWordbookOpener').click();
    await expect(page.getByRole('button', { name: 'マイ単語帳を閉じる', exact: true })).toBeFocused();
    await page.locator('#myWordbookNewName').fill('英語・中間テスト');
    await expect(page.locator('#myWordbookNewName')).toHaveValue('英語・中間テスト');
    await page.locator('#myWordbookCreateForm button').click();
    await page.locator('#myWordbookInput').fill('apple\nbicycle\nbook\ncat\nmountain\numbrella');
    await page.getByRole('button', { name: '照合する', exact: true }).click();
    await page.locator('#myWordbookApply').click();
    await expect(page.locator('[data-my-wordbook-tab=input]')).toBeFocused();
    const before = await page.evaluate(() => JSON.stringify([gameState.myWordbooks, gameState.myCustomWords]));
    const beforeSrs = await page.evaluate(() => JSON.stringify(gameState.srsData));
    for (const width of [320, 390, 768, 1280]) {
        await page.setViewportSize({ width, height: 844 });
        await page.getByRole('button', { name: '登録した単語', exact: true }).click();
        await expect(page.locator('#myWordbookEditorStats')).toContainText('未学習');
        await page.locator('#myWordbookScroll').evaluate(node => { node.scrollTop = node.scrollHeight; });
        const geometry = await page.locator('#myWordbookFooter').evaluate(node => ({
            box: node.getBoundingClientRect().toJSON(), width: innerWidth, height: innerHeight,
            bodyWidth: document.documentElement.scrollWidth,
        }));
        expect(geometry.box.y).toBeGreaterThanOrEqual(0);
        expect(geometry.box.bottom).toBeLessThanOrEqual(geometry.height);
        expect(geometry.box.right).toBeLessThanOrEqual(geometry.width);
        expect(geometry.bodyWidth).toBeLessThanOrEqual(geometry.width);
        await page.getByRole('button', { name: '入力して追加', exact: true }).click();
    }
    expect(await page.evaluate(() => JSON.stringify([gameState.myWordbooks, gameState.myCustomWords]))).toBe(before);
    expect(await page.evaluate(previous => JSON.stringify(gameState.srsData) === previous, beforeSrs)).toBe(true);
    await page.getByRole('button', { name: '‹ 単語帳一覧', exact: true }).click();
    await expect(page.locator('#myWordbookLibraryList .wb-book-states')).toHaveCount(1);
    await expect(page.locator('#myWordbookFooter')).toBeHidden();
    expect(await page.locator('.my-wordbook-card').evaluate(node => getComputedStyle(node).borderRadius)).toBe('12px');
    for (const width of [320, 390, 1280]) {
        await page.setViewportSize({ width, height: 844 });
        const card = page.locator('.my-wordbook-card');
        const geometry = await card.evaluate(node => ({
            height: node.getBoundingClientRect().height,
            width: node.clientWidth, contentWidth: node.scrollWidth,
            titleSize: getComputedStyle(node.querySelector('strong')).fontSize,
        }));
        expect(geometry.height).toBeLessThanOrEqual(205);
        expect(geometry.height).toBeGreaterThanOrEqual(44);
        expect(geometry.contentWidth).toBeLessThanOrEqual(geometry.width);
        expect(geometry.titleSize).toBe('17px');
        await expect(card.locator('.wb-book-states > span')).toHaveCount(4);
        await expect(card.locator('.wb-book-bottom')).toContainText('開く');
    }
    await page.reload();
    // Unanswered SRS entries receive their initial dueAt again on startup; compare persisted book data here.
    expect(await page.evaluate(() => JSON.stringify([gameState.myWordbooks, gameState.myCustomWords]))).toBe(before);
    expect(errors).toEqual([]);
});

test('マイ単語帳：選択画面のイラストの帯を揃え無料・有料の案内を保持', async ({ page }) => {
    for (const premium of [false, true]) {
        // Entitlement fixtures are restricted to this isolated, network-blocked test page.
        await page.evaluate(enabled => {
            localStorage.setItem('vocabGame_isUnlocked', String(enabled));
            localStorage.setItem('vocabGame_expiry', String(enabled ? Date.now() + 86400000 : 0));
        }, premium);
        await page.reload();
        await page.locator('#levelCurrentBtn').click();
        await page.locator('#wordbookBtn').click();
        const illustrated = page.locator('#wordbookModal [data-level=illustrated]');
        await expect(page.locator('#illustrationTrialLabel')).toHaveText(premium ? 'すべての収録語を学習可能' : '固定100語を無料で学習');
        await expect(illustrated.locator('.wordbook-copy strong')).toHaveText('イラスト単語帳');
        await expect(illustrated.locator('.wordbook-copy small').first()).toHaveText('絵といっしょに覚える');
        for (const width of [320, 390, 768, 1280]) {
            await page.setViewportSize({ width, height: 844 });
            const geometry = await illustrated.evaluate(node => {
                const box = node.getBoundingClientRect();
                return {
                    height: box.height,
                    myHeight: document.getElementById('myWordbookOpener').getBoundingClientRect().height,
                    overflows: node.scrollWidth > node.clientWidth || node.scrollHeight > node.clientHeight,
                    contentFits: Array.from(node.querySelectorAll('.wordbook-copy > *, .wordbook-icon, .wb-icon-chevron')).every(child => {
                        const rect = child.getBoundingClientRect();
                        return rect.top >= box.top && rect.bottom <= box.bottom && rect.left >= box.left && rect.right <= box.right;
                    }),
                };
            });
            expect(geometry.height).toBeLessThanOrEqual(geometry.myHeight + 1);
            if (width >= 390) expect(Math.abs(geometry.height - geometry.myHeight)).toBeLessThanOrEqual(1);
            expect(geometry.overflows).toBe(false);
            expect(geometry.contentFits).toBe(true);
        }
    }
});

test('マイ単語帳：M3Eの固定フッターは意味編集で隠れキャンセルで戻る', async ({ page }) => {
    await page.locator('#levelCurrentBtn').click();
    await page.locator('#wordbookBtn').click();
    await page.locator('#myWordbookOpener').click();
    await expect(page.getByRole('button', { name: 'マイ単語帳を閉じる', exact: true })).toBeFocused();
    await page.locator('#myWordbookNewName').fill('編集確認');
    await page.locator('#myWordbookCreateForm button').click();
    await page.getByRole('button', { name: '単語・意味を入力して追加', exact: true }).click();
    await expect(page.locator('#myWordbookCustomWord')).toBeFocused();
    await expect(page.locator('#myWordbookFooter')).toBeHidden();
    await expect(page.locator('#myWordbookEditorContent')).toBeHidden();
    await page.getByRole('button', { name: 'キャンセル', exact: true }).click();
    await expect(page.locator('#myWordbookFooter')).toBeVisible();
    await expect(page.getByRole('button', { name: '単語・意味を入力して追加', exact: true })).toBeFocused();
});
