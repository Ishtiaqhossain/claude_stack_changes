// Format a numeric result and append the unit symbol.
//   { precision }  fixed number of decimal places (default 4)
//   { sigfigs }    significant figures instead of fixed decimals
// Trailing zeros (and a bare trailing dot) are trimmed either way.
export function format(value, unit, { precision = 4, sigfigs = null } = {}) {
  const text = sigfigs != null ? trimZeros(value.toPrecision(sigfigs)) : trimZeros(value.toFixed(precision));
  return `${text} ${unit}`;
}

function trimZeros(s) {
  if (!s.includes('.')) return s;
  return s.replace(/\.?0+$/, '');
}
