import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyQuery } from '../src/query.js';
import { toTransactions } from '../src/transaction.js';
import { evaluateBudgets } from '../src/budgets.js';
import { getFormatter } from '../src/formatters/index.js';

const tx = toTransactions([
  { date: '2026-01-03', category: 'Groceries', description: 'Apples', amount: 10 },
  { date: '2026-01-10', category: 'Dining', description: 'Lunch', amount: 20 },
]);

test('table aligns columns and includes a TOTAL row', () => {
  const out = getFormatter('table').format('Report', applyQuery(tx));
  assert.equal(out.split('\n')[0], 'Report');
  assert.match(out, /Date {2,}Category/);
  assert.match(out, /TOTAL {2,}\$30\.00/);
});

test('summary without budgets lists category totals', () => {
  const out = getFormatter('summary').format('S', applyQuery(tx));
  assert.match(out, /Dining: \$20\.00/);
  assert.match(out, /Groceries: \$10\.00/);
  assert.match(out, /TOTAL {2}\$30\.00/);
});

test('summary with budgets shows over/under status', () => {
  const result = applyQuery(tx);
  result.budgets = evaluateBudgets(tx, { Dining: 10, Groceries: 50 });
  const out = getFormatter('summary').format('S', result);
  assert.match(out, /Dining: \$20\.00 of \$10\.00 \(200%\) — OVER/);
  assert.match(out, /Groceries: \$10\.00 of \$50\.00 \(20%\) — ok/);
});
