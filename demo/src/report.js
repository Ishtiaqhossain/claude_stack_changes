import { toTransactions } from './transaction.js';
import { applyQuery } from './query.js';
import { getFormatter } from './formatters/index.js';

// Builds an expense report. Rendering is delegated to a formatter looked up in
// the registry; with the identity query and the text formatter the output is
// unchanged — the seam is behavior-preserving (the report test still passes).
export function renderReport(title, transactions) {
  const result = applyQuery(toTransactions(transactions));
  return getFormatter('text').format(title, result);
}
