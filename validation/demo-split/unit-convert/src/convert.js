import { lookup } from './units.js';

// Convert `value` from one unit to another within the same dimension, via the
// dimension's canonical base: base = value*factor + offset, then invert.
export function convert(value, fromSymbol, toSymbol) {
  const from = lookup(fromSymbol);
  const to = lookup(toSymbol);
  if (from.dimension !== to.dimension) {
    throw new Error(
      `Cannot convert ${fromSymbol} (${from.dimension}) to ${toSymbol} (${to.dimension})`,
    );
  }
  const base = value * from.factor + from.offset;
  return (base - to.offset) / to.factor;
}
