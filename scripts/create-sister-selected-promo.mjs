// Freeze selected authored SVG animation states offline; never redraw the source artwork.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const require = createRequire(import.meta.url);
const sharp = require(process.env.SISTER_MEDIA_NODE_MODULES
    ? resolve(process.env.SISTER_MEDIA_NODE_MODULES, 'sharp') : 'sharp');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = resolve(root, '../PhrasalVerbApp');
const output = resolve(root, 'assets/sister-apps');
const work = resolve(output, '.media/selected-v3');
const fps = 30;
const paper = '#eeede6';
const jobs = [
    { id: 'even_core', duration: 4.5, viewBox: '0 74 640 342' },
    { id: 'there_is_core', duration: 2.2, viewBox: '0 35 240 145' },
    { id: 'dare_core', duration: 4.6, viewBox: '0 80 640 300' }
];
const sources = [];
mkdirSync(work, { recursive: true });

function run(args) {
    const result = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { encoding: 'utf8' });
    if (result.error || result.status !== 0) throw new Error(result.error?.message || result.stderr);
}
const declarations = text => Object.fromEntries(text.split(';').filter(x => x.includes(':'))
    .map(x => { const i = x.indexOf(':'); return [x.slice(0, i).trim(), x.slice(i + 1).trim()]; }));
function interpolate(a, b, fraction) {
    if (!fraction || a === b) return a;
    const numeric = /-?(?:\d*\.\d+|\d+)(?:e[-+]?\d+)?/gi;
    if (a.replace(numeric, '#') !== b.replace(numeric, '#')) return fraction < 1 ? a : b;
    const end = b.match(numeric) || []; let i = 0;
    return a.replace(numeric, n => String(Number((Number(n) + (Number(end[i++]) - Number(n)) * fraction).toFixed(7))));
}
function setAttributes(tag, values) {
    for (const [name, value] of Object.entries(values)) {
        assert(['transform', 'opacity', 'width', 'height', 'x', 'y', 'cx', 'cy', 'stroke-dashoffset', 'fill', 'fill-opacity'].includes(name), name);
        const attr = value.replace(/px/g, '');
        tag = tag.replace(new RegExp(`\\s${name}="[^"]*"`, 'g'), '');
        tag = tag.replace(/\/?>(?=$)/, ending => ` ${name}="${attr}"${ending}`);
    }
    return tag;
}
function cssTracks(svg) {
    const css = [...svg.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m => m[1]).join('\n');
    const keyframes = new Map();
    for (const match of css.matchAll(/@keyframes\s+([\w-]+)\s*\{((?:(?:\d+(?:\.\d+)?%)\s*\{[^{}]*\}\s*)+)\}/g)) {
        keyframes.set(match[1], [...match[2].matchAll(/(\d+(?:\.\d+)?)%\s*\{([^{}]*)\}/g)]
            .map(m => ({ at: Number(m[1]) / 100, values: declarations(m[2]) })));
    }
    const tracks = [];
    for (const match of css.matchAll(/([^{}]+)\{[^{}]*?animation:([^;}]+)[^{}]*\}/g)) {
        const selector = match[1].trim(), parts = match[2].trim().split(/\s+/);
        assert(/^#[\w-]+$|^\[data-node="[\w-]+"\]$/.test(selector), selector);
        assert(parts[2] === 'linear' && keyframes.has(parts[0]), match[2]);
        tracks.push({ selector, duration: parseFloat(parts[1]), frames: keyframes.get(parts[0]) });
    }
    return tracks;
}
function freeze(svg, time, tracks, timeline) {
    let result = svg.replace(/@keyframes\s+[\w-]+\s*\{((?:(?:\d+(?:\.\d+)?%)\s*\{[^{}]*\}\s*)+)\}/g, '')
        .replace(/animation:[^;}]+;?/g, '');
    // Resolve authored CSS color variables for the static SVG rasterizer.
    const vars = Object.fromEntries([...result.matchAll(/(--[\w-]+)\s*:\s*([^;}]+)/g)].map(m => [m[1], m[2].trim()]));
    result = result.replace(/var\((--[\w-]+)\)/g, (_, name) => { assert(vars[name], name); return vars[name]; });
    for (const track of tracks) {
        const position = Math.min(1, time / track.duration);
        let left = track.frames[0], right = track.frames.at(-1);
        for (const frame of track.frames) {
            if (frame.at <= position) left = frame;
            if (frame.at >= position) { right = frame; break; }
        }
        const fraction = right.at === left.at ? 0 : (position - left.at) / (right.at - left.at);
        const values = Object.fromEntries(Object.entries(left.values).map(([name, value]) =>
            [name, interpolate(value, right.values[name] ?? value, fraction)]));
        const attribute = track.selector.startsWith('#') ? 'id' : 'data-node';
        const target = attribute === 'id' ? track.selector.slice(1) : track.selector.match(/"([^"]+)"/)[1];
        const tag = new RegExp(`<[^>]+\\s${attribute}="${target}"[^>]*>`);
        assert(tag.test(result), target);
        result = result.replace(tag, opening => setAttributes(opening, values));
    }
    if (timeline) {
        // Same matrix/opacity interpolation as the owning app's svg-scene.js.
        const position = Math.min(time, timeline.duration) / timeline.duration * (timeline.frames.length - 1);
        const left = Math.floor(position), right = Math.min(left + 1, timeline.frames.length - 1), mix = position - left;
        timeline.keys.forEach((key, index) => {
            const value = timeline.frames[left][index].map((a, part) => a + (timeline.frames[right][index][part] - a) * mix);
            const tag = new RegExp(`<[^>]+\\sdata-motion-key="${key}"[^>]*>`);
            assert(tag.test(result));
            result = result.replace(tag, opening => setAttributes(opening, {
                transform: `matrix(${value.slice(0, 6).join(' ')})`, opacity: String(value[6]), 'stroke-dashoffset': String(value[7])
            }));
        });
    }
    return result;
}
for (const job of jobs) {
    const lesson = JSON.parse(readFileSync(resolve(sourceRoot, `assets/svg-audio/single/${job.id}/lesson.json`), 'utf8'));
    const svg = readFileSync(resolve(sourceRoot, lesson.core.svg.slice(1)), 'utf8');
    const timeline = lesson.core.timeline ? JSON.parse(readFileSync(resolve(sourceRoot, lesson.core.timeline.slice(1)), 'utf8')) : null;
    const tracks = cssTracks(svg);
    sources.push({ id: job.id, svg: lesson.core.svg, timeline: lesson.core.timeline,
        svgSha256: createHash('sha256').update(svg).digest('hex') });
    assert(tracks.length || timeline, `${job.id}: no animation`);
    const frames = resolve(work, job.id); mkdirSync(frames, { recursive: true });
    for (let i = 0; i < Math.round(job.duration * fps); i++) {
        const still = freeze(svg, i / fps, tracks, timeline).replace(/viewBox="[^"]+"/, `viewBox="${job.viewBox}"`);
        const artwork = await sharp(Buffer.from(still)).resize(680, 305, { fit: 'contain', background: paper }).png().toBuffer();
        await sharp({ create: { width: 720, height: 480, channels: 3, background: paper } })
            .composite([{ input: artwork, left: 20, top: 135 }]).png()
            .toFile(resolve(frames, `${String(i).padStart(4, '0')}.png`));
    }
    run(['-framerate', String(fps), '-i', resolve(frames, '%04d.png'), '-an', '-c:v', 'libx264',
        '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', resolve(work, `${job.id}.mp4`)]);
    console.log(`${job.id}: ${job.duration}s, existing ${timeline ? 'matrix samples' : 'CSS keyframes'}`);
}
const clips = [resolve(output, 'dictionary-promo-v1.mp4'), ...jobs.map(job => resolve(work, `${job.id}.mp4`))];
run([...clips.flatMap(clip => ['-i', clip]), '-filter_complex',
    clips.map((_, i) => `[${i}:v]setsar=1[v${i}]`).join(';') + ';'
        + clips.map((_, i) => `[v${i}]`).join('') + 'concat=n=4:v=1:a=0[out]',
    '-map', '[out]', '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart', resolve(output, 'dictionary-promo-v3.mp4')]);
run(['-ss', '2.1', '-i', resolve(output, 'dictionary-promo-v3.mp4'), '-frames:v', '1', '-q:v', '2',
    resolve(output, 'dictionary-promo-poster-v3.jpg')]);
writeFileSync(resolve(work, 'sources.json'), JSON.stringify({ fps, jobs, sources, duration: 13.7 }, null, 2));
console.log('dictionary v3: UP → even → there is → DARE, 13.7s, silent');
