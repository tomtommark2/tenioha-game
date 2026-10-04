// Historical batch snapshots remain immutable. Only explicitly recorded later
// image replacements are mapped back for historical registration checks.
const { readInputs: readCurrentInputs } = require('../../scripts/word-illustration-queue');
const repairs = require('../../docs/experiments/alpha-repair-2026-09-14/repairs.json');
const natural = require('../../docs/experiments/natural-release-2026-09-26/registration.json');
function readInputs({ includeAlphaRepairs = false, totalWords } = {}) {
  const input = readCurrentInputs();
  const naturalSources = new Map(natural.replacements.map(entry => [entry.src, entry.previous]));
  const oldSources = new Map(repairs.entries.map(entry => [entry.delivery, entry.previous]));
  const illustrations = input.illustrations.map(entry => {
    const src = naturalSources.get(entry.src) || entry.src;
    return { ...entry, src: includeAlphaRepairs ? src : oldSources.get(src) || src };
  });
  return { ...input, illustrations: totalWords ? illustrations.slice(0, totalWords) : illustrations };
}
module.exports = { readInputs };
