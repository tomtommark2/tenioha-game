const fs = require('fs');
const path = require('path');

const root = process.cwd();
const a = path.join(root, 'index.html');
const b = path.join(root, 'vocab_clicker_game.html');

if (!fs.existsSync(a) || !fs.existsSync(b)) {
  console.error('ERROR: index.html or vocab_clicker_game.html not found');
  process.exit(1);
}

const ab = fs.readFileSync(a);
const bb = fs.readFileSync(b);

if (Buffer.compare(ab, bb) !== 0) {
  console.error('NG: HTML files are NOT synchronized.');
  process.exit(1);
}

console.log('OK: HTML files are synchronized.');
