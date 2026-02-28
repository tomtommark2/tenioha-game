const fs = require('fs');
const path = require('path');

const root = process.cwd();
const src = path.join(root, 'index.html');
const dst = path.join(root, 'vocab_clicker_game.html');

if (!fs.existsSync(src)) {
  console.error('ERROR: index.html not found');
  process.exit(1);
}

fs.copyFileSync(src, dst);
console.log('Synced: index.html -> vocab_clicker_game.html');
