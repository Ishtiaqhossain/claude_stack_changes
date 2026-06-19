// Unit definitions. Every unit converts to its dimension's canonical base via an
// affine map: base = value * factor + offset. Linear units (length, mass, time,
// data, area, volume) have offset 0; temperature units are affine.
export const UNITS = {
  // length — base: metre
  m:  { dimension: 'length', factor: 1,        offset: 0 },
  km: { dimension: 'length', factor: 1000,     offset: 0 },
  cm: { dimension: 'length', factor: 0.01,     offset: 0 },
  mm: { dimension: 'length', factor: 0.001,    offset: 0 },
  mi: { dimension: 'length', factor: 1609.344, offset: 0 },
  yd: { dimension: 'length', factor: 0.9144,   offset: 0 },
  ft: { dimension: 'length', factor: 0.3048,   offset: 0 },
  in: { dimension: 'length', factor: 0.0254,   offset: 0 },

  // mass — base: gram
  g:  { dimension: 'mass', factor: 1,          offset: 0 },
  kg: { dimension: 'mass', factor: 1000,       offset: 0 },
  mg: { dimension: 'mass', factor: 0.001,      offset: 0 },
  lb: { dimension: 'mass', factor: 453.59237,  offset: 0 },
  oz: { dimension: 'mass', factor: 28.349523,  offset: 0 },
  st: { dimension: 'mass', factor: 6350.29318, offset: 0 },

  // temperature — base: kelvin (affine)
  K: { dimension: 'temperature', factor: 1,     offset: 0 },
  C: { dimension: 'temperature', factor: 1,     offset: 273.15 },
  F: { dimension: 'temperature', factor: 5 / 9, offset: 273.15 - (32 * 5) / 9 },

  // time — base: second
  s:   { dimension: 'time', factor: 1,      offset: 0 },
  ms:  { dimension: 'time', factor: 0.001,  offset: 0 },
  min: { dimension: 'time', factor: 60,     offset: 0 },
  hr:  { dimension: 'time', factor: 3600,   offset: 0 },
  day: { dimension: 'time', factor: 86400,  offset: 0 },
  wk:  { dimension: 'time', factor: 604800, offset: 0 },

  // data — base: byte (decimal SI)
  B:  { dimension: 'data', factor: 1,     offset: 0 },
  KB: { dimension: 'data', factor: 1e3,   offset: 0 },
  MB: { dimension: 'data', factor: 1e6,   offset: 0 },
  GB: { dimension: 'data', factor: 1e9,   offset: 0 },
  TB: { dimension: 'data', factor: 1e12,  offset: 0 },

  // area — base: square metre
  m2:  { dimension: 'area', factor: 1,          offset: 0 },
  km2: { dimension: 'area', factor: 1e6,        offset: 0 },
  cm2: { dimension: 'area', factor: 1e-4,       offset: 0 },
  ft2: { dimension: 'area', factor: 0.09290304, offset: 0 },
  ha:  { dimension: 'area', factor: 1e4,        offset: 0 },

  // volume — base: litre
  L:   { dimension: 'volume', factor: 1,           offset: 0 },
  mL:  { dimension: 'volume', factor: 0.001,       offset: 0 },
  m3:  { dimension: 'volume', factor: 1000,        offset: 0 },
  gal: { dimension: 'volume', factor: 3.785411784, offset: 0 },
  qt:  { dimension: 'volume', factor: 0.946352946, offset: 0 },
};

export function lookup(symbol) {
  const unit = UNITS[symbol];
  if (!unit) throw new Error(`Unknown unit: ${symbol}`);
  return unit;
}

export function unitsInDimension(dimension) {
  return Object.keys(UNITS).filter((s) => UNITS[s].dimension === dimension);
}
