import { UNITS } from './units.js';

// Suggest the closest known unit symbol to a misspelling, or null if nothing is
// within edit distance 2.
export function suggest(symbol) {
  let best = null;
  let bestDistance = Infinity;
  for (const known of Object.keys(UNITS)) {
    const d = editDistance(symbol, known);
    if (d < bestDistance) {
      bestDistance = d;
      best = known;
    }
  }
  return bestDistance <= 2 ? best : null;
}

// Levenshtein edit distance.
function editDistance(a, b) {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const dp = Array.from({ length: rows }, () => new Array(cols).fill(0));
  for (let i = 0; i < rows; i++) dp[i][0] = i;
  for (let j = 0; j < cols; j++) dp[0][j] = j;
  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[rows - 1][cols - 1];
}
