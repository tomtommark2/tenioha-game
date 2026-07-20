const fs = require('fs');
const path = require('path');

const root = process.cwd();
const versionFile = path.join(root, 'js', 'version.js');
const indexFile = path.join(root, 'index.html');

const VERSIONED_ASSETS = [
  'style.css',
  'data/vocabulary.js',
  'data/ipa_overrides.js',
  'data/announcements.js',
  'js/version.js',
  'js/update_manager.js',
  'js/config.js',
  'js/utils.js',
  'js/game_logic.js',
  'js/ui_manager.js',
  'js/firebase_app_v2.js',
];

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function pad(value) {
  return String(value).padStart(2, '0');
}

function buildTimestampVersion(now = new Date()) {
  return `${now.getFullYear()}.${pad(now.getMonth() + 1)}${pad(now.getDate())}.${pad(now.getHours())}${pad(now.getMinutes())}`;
}

if (!fs.existsSync(versionFile)) fail('js/version.js not found');
if (!fs.existsSync(indexFile)) fail('index.html not found');

const nextVersion = buildTimestampVersion();
const versionSource = fs.readFileSync(versionFile, 'utf8');
const currentMatch = versionSource.match(/GAME_VERSION\s*=\s*["']([^"']+)["']/);
if (!currentMatch) fail('Could not parse GAME_VERSION in js/version.js');

const updatedVersionSource = versionSource.replace(
  /GAME_VERSION\s*=\s*["'][^"']+["']/,
  `GAME_VERSION = "${nextVersion}"`
);
fs.writeFileSync(versionFile, updatedVersionSource, 'utf8');

let html = fs.readFileSync(indexFile, 'utf8');
for (const file of VERSIONED_ASSETS) {
  const escaped = file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`(${escaped}\\?v=)[^"'&\\s>]+`, 'g');
  html = html.replace(pattern, `$1${nextVersion}`);
}
fs.writeFileSync(indexFile, html, 'utf8');

console.log(`Version bumped: ${currentMatch[1]} -> ${nextVersion}`);
console.log(`Updated managed asset queries to ?v=${nextVersion}.`);
