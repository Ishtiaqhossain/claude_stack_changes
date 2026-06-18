import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateBudgets } from '../src/budgets.js';
import { toTransactions } from '../src/transaction.js';

const tx = toTransactions([
  { date: '2026-01-01', category: 'Dining', description: 'a', amount: 100 },
  { date: '2026-01-02', category: 'Dining', description: 'b', amount: 80 },
  { date: '2026-01-03', category: 'Groceries', description: 'c', amount: 50 },
]);

test('flags over-budget categories with remaining and percent', () => {
  const rows = evaluateBudgets(tx, { Dining: 150, Groceries: 200 });
  const dining = rows.find((r) => r.category === 'Dining');
  assert.equal(dining.spent.toNumber(), 180);
  assert.equal(dining.overBudget, true);
  assert.equal(dining.remaining.toNumber(), -30);
  assert.equal(dining.percent, 120);

  const groceries = rows.find((r) => r.category === 'Groceries');
  assert.equal(groceries.overBudget, false);
  assert.equal(groceries.remaining.toNumber(), 150);
});

test('unbudgeted category has a zero budget and null percent', () => {
  const rows = evaluateBudgets(tx, { Dining: 150 });
  const groceries = rows.find((r) => r.category === 'Groceries');
  assert.equal(groceries.budget.cents, 0);
  assert.equal(groceries.percent, null);
  assert.equal(groceries.overBudget, false);
});
