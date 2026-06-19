import { toTransactions } from './transaction.js';
import { Money } from './money.js';

// Builds a plain-text expense report. Totalling now goes through the typed Money
// model (integer cents, no float rounding); the text output is unchanged — the
// existing report test still passes byte-for-byte, which is the refactor proof.
export function renderReport(title, transactions) {
  const rows = toTransactions(transactions);
  const lines = [title, '='.repeat(title.length)];

  let total = Money.zero();
  for (const t of rows) {
    total = total.plus(t.amount);
    lines.push(`${t.date}  ${t.category}  ${t.description}  ${t.amount.toString()}`);
  }

  lines.push('-'.repeat(title.length));
  lines.push(`TOTAL  ${total.toString()}`);
  return lines.join('\n');
}
