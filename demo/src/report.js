import { toTransactions } from './transaction.js';
import { applyQuery } from './query.js';
import { getFormatter } from './formatters/index.js';

// Generate a report: convert raw rows -> Transactions, run the query pipeline
// (filter + sort + group), then render with the chosen formatter.
//
// options = { format = 'text', filters = {}, groupBy = null, sortBy = null, desc = false }
export function generateReport(title, transactions, options = {}) {
  const { format = 'text', filters = {}, groupBy = null, sortBy = null, desc = false } = options;
  const result = applyQuery(toTransactions(transactions), { filters, groupBy, sortBy, desc });
  return getFormatter(format).format(title, result);
}

// Back-compat: the original text-only entry point.
export function renderReport(title, transactions) {
  return generateReport(title, transactions, { format: 'text' });
}
