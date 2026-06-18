import { Money } from '../money.js';

// Per-category totals for an ungrouped or grouped result.
function categoryTotals(result) {
  const totals = new Map();
  for (const t of result.groups.flatMap((g) => g.rows)) {
    totals.set(t.category, (totals.get(t.category) ?? Money.zero()).plus(t.amount));
  }
  return [...totals.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

// Renders a high-level summary. When the result carries budget evaluation
// (result.budgets), it shows spent vs. budget and an OVER/ok status; otherwise
// it shows category totals.
export class SummaryFormatter {
  format(title, result) {
    const lines = [title, '='.repeat(title.length)];

    if (result.budgets) {
      for (const b of result.budgets) {
        const status = b.budget.cents === 0 ? '(no budget)' : b.overBudget ? 'OVER' : 'ok';
        const pct = b.percent == null ? '' : ` (${b.percent}%)`;
        lines.push(
          `${b.category}: ${b.spent.toString()} of ${b.budget.toString()}${pct} — ${status}`,
        );
      }
    } else {
      for (const [category, total] of categoryTotals(result)) {
        lines.push(`${category}: ${total.toString()}`);
      }
    }

    lines.push('-'.repeat(title.length));
    lines.push(`TOTAL  ${result.total.toString()}`);
    return lines.join('\n');
  }
}
