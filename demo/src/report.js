import { toTransactions } from './transaction.js';
import { applyQuery } from './query.js';

// Builds a plain-text expense report. Rows now flow through the query pipeline
// (applyQuery), which today returns the identity result, so the text output is
// unchanged. This is a pure refactor that introduces the seam features hang off.
export function renderReport(title, transactions) {
  const result = applyQuery(toTransactions(transactions));
  const lines = [title, '='.repeat(title.length)];

  for (const group of result.groups) {
    for (const t of group.rows) {
      lines.push(`${t.date}  ${t.category}  ${t.description}  ${t.amount.toString()}`);
    }
  }

  lines.push('-'.repeat(title.length));
  lines.push(`TOTAL  ${result.total.toString()}`);
  return lines.join('\n');
}
