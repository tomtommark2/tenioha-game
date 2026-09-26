// Deterministic delivery resizing; originals and the vocabulary registry are never edited.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');

const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
function readRegistry(root) {
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'data/word-illustrations.js'), 'utf8'), context);
  return context.window.WORD_ILLUSTRATIONS;
}
function assetPath(root, src) {
  if (!/^assets\/word-illustrations\/[^/\\]+\.webp$/.test(src)) throw Error(`Unexpected asset path: ${src}`);
  return path.join(root, src);
}
function visibleEqual(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 4) {
    if (a[i + 3] !== b[i + 3]) return false;
    if (a[i + 3] && (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2])) return false;
  }
  return true;
}
async function resizeAsset(sharp, input) {
  const original = await sharp(input).metadata();
  // Resample RGBA together: transparent edge colors must not bleed into opaque shapes.
  const resized = await sharp(input).ensureAlpha().resize({ width: 480, height: 480,
    fit: 'inside', withoutEnlargement: true, kernel: 'lanczos3' }).raw().toBuffer({ resolveWithObject: true });
  const encoded = await sharp(resized.data, { raw: resized.info }).webp({ lossless: true, effort: 4 }).toBuffer();
  const decoded = await sharp(encoded).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  assert.equal(decoded.info.width, resized.info.width);
  assert.equal(decoded.info.height, resized.info.height);
  assert.ok(visibleEqual(resized.data, decoded.data), 'WebP changed resized visible RGBA');
  assert.ok(Math.max(decoded.info.width, decoded.info.height) <= 480);
  const alpha = [];
  for (let i = 3; i < decoded.data.length; i += 4) alpha.push(decoded.data[i]);
  assert.ok(alpha.includes(0), 'Transparent background missing');
  // The resampler can round an opaque 255 to 254; do not alter the artwork's alpha.
  assert.ok(alpha.some(value => value >= 254), 'Near-opaque subject missing');
  return { encoded, original, width: decoded.info.width, height: decoded.info.height };
}
async function main() {
  const args = process.argv.slice(2);
  const option = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
  const root = path.resolve(option('--root', path.join(__dirname, '..')));
  const output = path.resolve(option('--output', path.join(root, 'tmp/illustration-delivery-480')));
  const targetArg = option('--apply-to');
  const target = targetArg && path.resolve(targetArg);
  if (output === root || target === root || target === output) throw Error('Output/target must be separate from originals');
  const sharp = require(require.resolve('sharp', { paths: [option('--sharp-root', root)] }));
  sharp.concurrency(2);
  const rows = readRegistry(root);
  let sources = [...new Set(rows.map(row => row.src))];
  const sample = args.includes('--sample');
  if (sample && target) throw Error('Sample runs cannot modify a release checkout');
  if (sample) {
    const words = ['apple', 'shoulder', 'clock', 'shelter', 'harbour', 'ice hockey', 'lecture', 'episode', 'escalator', 'singular'];
    const selected = words.map(word => rows.find(row => row.word === word)?.src).filter(Boolean);
    selected.push(sources.reduce((a, b) => fs.statSync(assetPath(root, a)).size > fs.statSync(assetPath(root, b)).size ? a : b));
    for (const src of sources) {
      const meta = await sharp(assetPath(root, src)).metadata();
      if (meta.width !== meta.height) selected.push(src);
    }
    sources = [...new Set(selected)];
  }
  if (target) assert.equal(JSON.stringify(readRegistry(target)), JSON.stringify(rows), 'Release/source registries differ');
  const manifestPath = path.join(output, sample ? 'sample-manifest.json' : 'manifest.json');
  const priorPath = fs.existsSync(path.join(output, 'manifest.json')) ? path.join(output, 'manifest.json') : path.join(output, 'sample-manifest.json');
  const prior = fs.existsSync(priorPath) ? JSON.parse(fs.readFileSync(priorPath, 'utf8')) : { records: [] };
  const records = new Array(sources.length);
  let next = 0, completed = 0;
  await Promise.all([0, 1].map(async () => {
    while (next < sources.length) {
      const index = next++, src = sources[index];
      const input = fs.readFileSync(assetPath(root, src));
      const sourceSha256 = digest(input), file = assetPath(output, src);
      const cached = prior.records.find(record => record.src === src && record.sourceSha256 === sourceSha256);
      if (cached && fs.existsSync(file) && digest(fs.readFileSync(file)) === cached.deliverySha256) {
        records[index] = cached;
      } else {
        const resized = await resizeAsset(sharp, input);
        fs.mkdirSync(path.dirname(file), { recursive: true });
        // Recover an interrupted batch only when its bytes match a fresh conversion.
        if (fs.existsSync(file)) assert.equal(digest(fs.readFileSync(file)), digest(resized.encoded), `Unrelated delivery file: ${file}`);
        else fs.writeFileSync(file, resized.encoded, { flag: 'wx' });
        records[index] = { src, word: rows.find(row => row.src === src).word,
          sourceSha256, deliverySha256: digest(resized.encoded), sourceBytes: input.length,
          deliveryBytes: resized.encoded.length, sourceWidth: resized.original.width, sourceHeight: resized.original.height,
          width: resized.width, height: resized.height, visibleRgbaEqualsResampled: true };
      }
      completed++;
      if (completed % 100 === 0 || completed === sources.length) console.log(`${completed}/${sources.length}`);
    }
  }));
  const sizes = records.map(r => r.deliveryBytes).sort((a, b) => a - b);
  const sourceBytes = records.reduce((sum, r) => sum + r.sourceBytes, 0);
  const deliveryBytes = sizes.reduce((sum, n) => sum + n, 0);
  const summary = { count: records.length, sourceBytes, deliveryBytes, reductionPercent: 100 * (1 - deliveryBytes / sourceBytes),
    meanBytes: Math.round(deliveryBytes / records.length), medianBytes: sizes[Math.floor(sizes.length / 2)],
    p95Bytes: sizes[Math.floor(sizes.length * .95)], maxBytes: sizes.at(-1) };
  // All original hashes are rechecked before applying any release replacements.
  for (const record of records) {
    assert.equal(digest(fs.readFileSync(assetPath(root, record.src))), record.sourceSha256, `Original changed: ${record.src}`);
    if (target) {
      const existing = digest(fs.readFileSync(assetPath(target, record.src)));
      assert.ok([record.sourceSha256, record.deliverySha256].includes(existing), `Unrelated release edit: ${record.src}`);
    }
  }
  const manifest = { createdAt: new Date().toISOString(), encoding: '480px longest edge, Lanczos3, aspect preserved, lossless WebP effort 4',
    originalsRoot: root, outputRoot: output, appliedTo: null, summary, records };
  fs.mkdirSync(output, { recursive: true });
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  if (target) {
    for (const record of records) {
      fs.copyFileSync(assetPath(output, record.src), assetPath(target, record.src));
      assert.equal(digest(fs.readFileSync(assetPath(target, record.src))), record.deliverySha256);
    }
    manifest.appliedTo = target;
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  }
  console.log(JSON.stringify({ ...summary, manifestPath, appliedTo: manifest.appliedTo }));
}
if (require.main === module) main().catch(error => { console.error(error); process.exitCode = 1; });
module.exports = { resizeAsset, visibleEqual, assetPath };
