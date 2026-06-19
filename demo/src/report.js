import { toTransactions } from './transaction.js';
import { applyQuery } from './query.js';
import { evaluateBudgets } from './budgets.js';
import { getFormatter } from './formatters/index.js';

// Generate a report: convert raw rows -> Transactions, run the query pipeline
// (filter + sort + group), optionally attach budget evaluation, then render with
// the chosen formatter. `renderReport` stays the text-only shorthand.
export function generateReport(title, transactions, options = {}) {
  const { format = 'text', filters = {}, groupBy = null, sortBy = null, desc = false, budget = false } =
    options;
  const result = applyQuery(toTransactions(transactions), { filters, groupBy, sortBy, desc });
  if (budget) {
    result.budgets = evaluateBudgets(result.groups.flatMap((g) => g.rows));
  }
  return getFormatter(format).format(title, result);
}

export function renderReport(title, transactions) {
  return generateReport(title, transactions, { format: 'text' });
}
