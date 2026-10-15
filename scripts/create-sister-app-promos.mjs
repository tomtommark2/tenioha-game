// Reproducible, silent PR derivatives. Never alter the owning projects' originals.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const workspace = resolve(root, '..');
const output = resolve(root, 'assets/sister-apps');
const jobs = [
    {
        id: 'dictionary',
        source: resolve(workspace, 'PhrasalVerbApp/assets/videos/particles/up/up-core-light-magenta-720p.mp4'),
        ranges: [[0.75, 1.35], [2.2, 4.0]],
        crop: 'crop=780:520:300:190,scale=720:480',
        posterAt: 2.1
    },
    {
        id: 'sentence',
        source: resolve(workspace, '動く文法図鑑/docs/product/production/pr-assets/major-update-native-structure.gif'),
        ranges: [[0, 0.6], [2.6, 7.4]],
        crop: 'crop=780:384:60:66,scale=780:384',
        posterAt: 5.1
    }
];

function run(args) {
    const result = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { encoding: 'utf8' });
    if (result.error || result.status !== 0) throw new Error(result.error?.message || result.stderr);
}

for (const job of process.argv.includes('--dictionary-multi') ? [] : jobs) {
    if (!existsSync(job.source)) throw new Error(`Missing source: ${job.source}`);
    const trims = job.ranges.map(([start, end], i) =>
        `[0:v]trim=start=${start}:end=${end},setpts=PTS-STARTPTS[v${i}]`).join(';');
    const parts = job.ranges.map((_, i) => `[v${i}]`).join('');
    const filter = `${trims};${parts}concat=n=${job.ranges.length}:v=1:a=0,${job.crop},fps=30,format=yuv420p[out]`;
    const video = resolve(output, `${job.id}-promo-v1.mp4`);
    run(['-i', job.source, '-filter_complex', filter, '-map', '[out]', '-an',
        '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-movflags', '+faststart', video]);
    run(['-ss', String(job.posterAt), '-i', video, '-frames:v', '1', '-q:v', '2',
        resolve(output, `${job.id}-promo-poster-v1.jpg`)]);
    console.log(`${job.id}: ${job.ranges.reduce((sum, [start, end]) => sum + end - start, 0).toFixed(1)}s, silent`);
}

// Four short examples from three existing lessons, not the full paid lessons.
// Match these boundaries with SisterApps.apps[0].examples in js/sister_apps.js.
const examples = [
    { phrase: 'put-off', start: 10.8, end: 14.4, crop: 'crop=1080:250:100:290' },
    { phrase: 'put-off', start: 19.4, end: 23.6, crop: 'crop=980:270:160:250' },
    { phrase: 'figure-out', start: 11.0, end: 15.2, crop: 'crop=740:260:280:285' },
    { phrase: 'take-over', start: 6.3, end: 10.3, crop: 'crop=1000:320:140:260' }
];
const inputs = examples.map(example => resolve(workspace,
    `PhrasalVerbApp/assets/videos/phrasal/${example.phrase}/${example.phrase}-light-magenta-720p.mp4`));
inputs.forEach(source => { if (!existsSync(source)) throw new Error(`Missing source: ${source}`); });
const trims = examples.map((example, i) => `[${i}:v]trim=start=${example.start}:end=${example.end},`
    + `setpts=PTS-STARTPTS,${example.crop},scale=720:-2,`
    + `pad=720:480:0:(oh-ih)/2:color=0xf0eee8,setsar=1,fps=30,format=yuv420p[v${i}]`).join(';');
const parts = examples.map((_, i) => `[v${i}]`).join('');
const video = resolve(output, 'dictionary-promo-v2.mp4');
run([...inputs.flatMap(source => ['-i', source]), '-filter_complex',
    `${trims};${parts}concat=n=${examples.length}:v=1:a=0[out]`, '-map', '[out]', '-an',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-movflags', '+faststart', video]);
run(['-ss', '3.2', '-i', video, '-frames:v', '1', '-q:v', '2',
    resolve(output, 'dictionary-promo-poster-v2.jpg')]);
console.log(`dictionary v2: ${examples.reduce((sum, example) => sum + example.end - example.start, 0).toFixed(1)}s, 4 examples, silent`);
