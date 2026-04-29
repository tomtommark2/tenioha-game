const fs = require('fs');
const path = require('path');

const root = process.cwd();
const versionFile = path.join(root, 'js', 'version.js');
const htmlFiles = [path.join(root, 'index.html'), path.join(root, 'vocab_clicker_game.html')];

function fail(msg) {
  console.error(`NG: ${msg}`);
  process.exit(1);
}

if (!fs.existsSync(versionFile)) fail('js/version.js not found');

const versionSrc = fs.readFileSync(versionFile, 'utf8');
const m = versionSrc.match(/GAME_VERSION\s*=\s*"v(\d+\.\d+)"/);
if (!m) fail('Could not parse GAME_VERSION in js/version.js');
const expected = m[1];

const targets = [
  'style.css',
  'data/vocabulary.js',
  'data/ipa_overrides.js',
  'js/version.js',
  'js/update_manager.js',
  'js/config.js',
  'js/utils.js',
  'js/stats_engine.js',
  'js/chart_data_adapter.js',
  'js/chart_fallback.js',
  'js/game_logic.js',
  'js/ui_manager.js',
  'js/firebase_app_v2.js'
];

for (const file of htmlFiles) {
  if (!fs.existsSync(file)) fail(`${path.basename(file)} not found`);
  const src = fs.readFileSync(file, 'utf8');
  for (const t of targets) {
    const escaped = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`${escaped}\\?v=(\\d+\\.\\d+)`, 'g');
    const found = [...src.matchAll(re)].map(x => x[1]);
    if (found.length === 0) {
      fail(`${path.basename(file)} missing version query for ${t}`);
    }
    for (const v of found) {
      if (v !== expected) {
        fail(`${path.basename(file)} has ${t}?v=${v}, expected ${expected}`);
      }
    }
  }
}

console.log(`OK: version sync passed (expected v${expected})`);
