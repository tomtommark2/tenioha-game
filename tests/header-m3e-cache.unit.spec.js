const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

test('学習分類のCSSと公式アイコンをキャッシュ・版番号管理に登録する', () => {
    const root = path.resolve(__dirname, '..');
    const version = fs.readFileSync(path.join(root, 'js/version.js'), 'utf8').match(/GAME_VERSION\s*=\s*["']([^"']+)/)[1];
    const worker = fs.readFileSync(path.join(root, 'service_worker.js'), 'utf8');
    const assets = vm.runInNewContext(`${worker}\nASSETS`, {
        importScripts() {}, GAME_VERSION: version, self: { addEventListener() {} }
    });
    for (const file of ['header-m3e.css', 'assets/ui/menu-book-outline-rounded.svg',
        'assets/ui/refresh-rounded.svg', 'assets/ui/check-circle-rounded.svg', 'assets/ui/auto-awesome-rounded.svg']) {
        expect(assets).toContain(`./${file}`);
        expect(fs.existsSync(path.join(root, file))).toBe(true);
    }
    expect(assets).toContain(`./header-m3e.css?v=${version}`);
    for (const script of ['scripts/bump-version.js', 'scripts/check-version-sync.js']) {
        expect(fs.readFileSync(path.join(root, script), 'utf8')).toContain("'header-m3e.css'");
    }
});
