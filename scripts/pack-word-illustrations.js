// Lossless delivery encoding only: no resizing, recoloring, cropping or source replacement.
const fs = require('node:fs');
const path = require('node:path');
const { readInputs } = require('./word-illustration-queue');

async function packAssets({ root, sharp, sources }) {
  const records = [];
  const assetRoot = path.resolve(root, 'assets/word-illustrations');
  for (const source of [...new Set(sources)]) {
    if (!source.endsWith('.png')) throw new Error(`Expected PNG source: ${source}`);
    const input = path.resolve(root, source);
    if (path.dirname(input) !== assetRoot) throw new Error(`Asset outside word-illustrations: ${source}`);
    const output = input.replace(/\.png$/, '.webp');
    const alreadyExists = fs.existsSync(output);
    const original = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const encoded = alreadyExists ? fs.readFileSync(output) : await sharp(input).webp({ lossless: true, effort: 6 }).toBuffer();
    const decoded = await sharp(encoded).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    if (original.info.width !== decoded.info.width || original.info.height !== decoded.info.height) {
      throw new Error(`Dimensions changed for ${source}`);
    }
    let transparentPixels = 0;
    for (let i = 0; i < original.data.length; i += 4) {
      const alpha = original.data[i + 3];
      if (alpha === 0) transparentPixels++;
      // RGB under fully transparent pixels is not visible and may be normalized by WebP.
      if (alpha !== decoded.data[i + 3] || (alpha > 0 && (
        original.data[i] !== decoded.data[i] || original.data[i + 1] !== decoded.data[i + 1] || original.data[i + 2] !== decoded.data[i + 2]
      ))) throw new Error(`Visible pixels changed for ${source}`);
    }
    if (!transparentPixels) throw new Error(`Missing transparent background: ${source}`);
    if (!alreadyExists) fs.writeFileSync(output, encoded, { flag: 'wx' });
    records.push({ source, delivery: path.relative(root, output).replaceAll('\\', '/'),
      width: original.info.width, height: original.info.height,
      sourceBytes: fs.statSync(input).size, deliveryBytes: encoded.length,
      transparentPixels, visiblePixelsIdentical: true,
    });
  }
  return records;
}

if (require.main === module) {
  (async () => {
    const root = path.resolve(__dirname, '..');
    const sharpIndex = process.argv.indexOf('--sharp-root');
    const sharp = sharpIndex >= 0
      ? require(require.resolve('sharp', { paths: [process.argv[sharpIndex + 1]] }))
      : require('sharp');
    const sourceIndex = process.argv.indexOf('--sources');
    const sources = sourceIndex >= 0
      ? JSON.parse(fs.readFileSync(process.argv[sourceIndex + 1], 'utf8')).entries.map(entry => entry.asset)
      : readInputs(root).illustrations.map(entry => entry.src.replace(/\.webp$/, '.png'));
    const records = await packAssets({ root, sharp, sources });
    const reportIndex = process.argv.indexOf('--report');
    if (reportIndex >= 0) {
      const report = path.resolve(root, process.argv[reportIndex + 1]);
      if (!report.startsWith(path.join(root, 'docs/experiments/noun-production') + path.sep)) throw new Error('Report must be inside noun-production.');
      fs.mkdirSync(path.dirname(report), { recursive: true });
      fs.writeFileSync(report, JSON.stringify({ encoding: 'lossless WebP, original dimensions, unchanged visible RGBA', records }, null, 2) + '\n', { flag: 'wx' });
    }
    console.log(JSON.stringify({ count: records.length, sourceBytes: records.reduce((sum, record) => sum + record.sourceBytes, 0),
      deliveryBytes: records.reduce((sum, record) => sum + record.deliveryBytes, 0), records }, null, 2));
  })().catch(error => { console.error(error); process.exitCode = 1; });
}

module.exports = { packAssets };
