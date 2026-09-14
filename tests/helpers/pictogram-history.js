// Historical batch snapshots remain immutable. Only explicitly recorded later
// image replacements are mapped back for historical registration checks.
const { readInputs: readCurrentInputs } = require('../../scripts/word-illustration-queue');
const repairs = require('../../docs/experiments/alpha-repair-2026-09-14/repairs.json');
function readInputs() {
  const input = readCurrentInputs();
  const oldSources = new Map(repairs.entries.map(entry => [entry.delivery, entry.previous]));
  return { ...input, illustrations: input.illustrations.map(entry => ({ ...entry, src: oldSources.get(entry.src) || entry.src })) };
}
module.exports = { readInputs };
