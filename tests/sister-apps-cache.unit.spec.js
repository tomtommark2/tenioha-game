const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

test('姉妹アプリのJS・CSS・公式アイコンをキャッシュと版番号管理へ登録する', () => {
    const root = path.resolve(__dirname, '..');
    const version = fs.readFileSync(path.join(root, 'js/version.js'), 'utf8').match(/GAME_VERSION\s*=\s*["']([^"']+)/)[1];
    const worker = fs.readFileSync(path.join(root, 'service_worker.js'), 'utf8');
    const assets = vm.runInNewContext(`${worker}\nASSETS`, {
        importScripts() {}, GAME_VERSION: version, self: { addEventListener() {} }
    });
    for (const file of ['sister-apps.css', 'js/sister_apps.js', 'assets/sister-apps/dictionary-icon.png',
        'assets/sister-apps/sentence-icon.png', 'assets/ui/grid-view-rounded.svg', 'assets/ui/open-in-new-rounded.svg',
        'assets/ui/close-rounded.svg']) {
        expect(assets).toContain(`./${file}`);
        expect(fs.existsSync(path.join(root, file))).toBe(true);
    }
    for (const id of ['dictionary', 'sentence']) {
        const revision = id === 'dictionary' ? 'v3' : 'v1';
        const poster = `assets/sister-apps/${id}-promo-poster-${revision}.jpg`;
        expect(assets).toContain(`./${poster}`);
        expect(fs.existsSync(path.join(root, poster))).toBe(true);
        const video = `assets/sister-apps/${id}-promo-${revision}.mp4`;
        // Promotional motion must not add video downloads to the initial learning screen.
        expect(assets).not.toContain(`./${video}`);
        expect(fs.statSync(path.join(root, video)).size).toBeLessThan(id === 'dictionary' ? 180000 : 150000);
    }
    for (const file of ['sister-apps.css', 'js/sister_apps.js']) {
        expect(assets).toContain(`./${file}?v=${version}`);
        for (const script of ['scripts/bump-version.js', 'scripts/check-version-sync.js']) {
            expect(fs.readFileSync(path.join(root, script), 'utf8')).toContain(`'${file}'`);
        }
    }
});
