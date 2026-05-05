const fs = require('fs');
const path = require('path');

const root = process.cwd();
const versionFile = path.join(root, 'js', 'version.js');
const indexFile = path.join(root, 'index.html');

function fail(msg) {
  console.error(`ERROR: ${msg}`);
  process.exit(1);
}

if (!fs.existsSync(versionFile)) fail('js/version.js not found');
if (!fs.existsSync(indexFile)) fail('index.html not found');

const versionSrc = fs.readFileSync(versionFile, 'utf8');
const m = versionSrc.match(/GAME_VERSION\s*=\s*"v(\d+)\.(\d+)"/);
if (!m) fail('Could not parse GAME_VERSION in js/version.js');

const major = Number(m[1]);
const patch = Number(m[2]);
const patchWidth = m[2].length;
const nextPatch = String(patch + 1).padStart(patchWidth, '0');
const next = `v${major}.${nextPatch}`;
const nextNum = `${major}.${nextPatch}`;

const nextVersionSrc = versionSrc.replace(/GAME_VERSION\s*=\s*"v\d+\.\d+"/, `GAME_VERSION = "${next}"`);
fs.writeFileSync(versionFile, nextVersionSrc, 'utf8');

let html = fs.readFileSync(indexFile, 'utf8');

const targets = [
  'style.css',
  'data/vocabulary.js',
  'data/ipa_overrides.js',
  'data/announcements.js',
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

for (const file of targets) {
  const escaped = file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(${escaped}\\?v=)(\\d+\\.\\d+)`, 'g');
  html = html.replace(re, `$1${nextNum}`);
}

fs.writeFileSync(indexFile, html, 'utf8');

console.log(`Bumped GAME_VERSION: v${major}.${patch} -> ${next}`);
console.log(`Updated cache-busting query to ?v=${nextNum} in index.html managed assets.`);
console.log('Next: npm run sync:html && npm run check:version-sync');
