import { UNITS } from './units.js';

// Produce a human-readable listing of every supported unit, grouped by dimension.
export function listUnits() {
  const byDimension = {};
  for (const [symbol, unit] of Object.entries(UNITS)) {
    (byDimension[unit.dimension] ??= []).push(symbol);
  }
  return Object.keys(byDimension)
    .sort()
    .map((dimension) => `${dimension}: ${byDimension[dimension].join(', ')}`)
    .join('\n');
}
