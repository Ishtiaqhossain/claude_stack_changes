import { toTransactions } from './transaction.js';
import { applyQuery } from './query.js';
import { evaluateBudgets } from './budgets.js';
import { getFormatter } from './formatters/index.js';

// Generate a report: convert raw rows -> Transactions, run the query pipeline
// (filter + sort + group), optionally attach budget evaluation, then render
// with the chosen formatter.
//
// options = {
//   format = 'text',
//   filters = {}, groupBy = null, sortBy = null, desc = false,
//   budget = false,
// }
export function generateReport(title, transactions, options = {}) {
  const { format = 'text', filters = {}, groupBy = null, sortBy = null, desc = false, budget = false } =
    options;

  const rows = toTransactions(transactions);
  const result = applyQuery(rows, { filters, groupBy, sortBy, desc });
  if (budget) {
    result.budgets = evaluateBudgets(result.groups.flatMap((g) => g.rows));
  }
  return getFormatter(format).format(title, result);
}

// Back-compat: the original text-only entry point. Kept so existing callers and
// tests that just want "the text report" don't have to change.
export function renderReport(title, transactions) {
  return generateReport(title, transactions, { format: 'text' });
}
