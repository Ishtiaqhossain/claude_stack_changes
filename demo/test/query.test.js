import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyQuery } from '../src/query.js';
import { toTransactions } from '../src/transaction.js';

const tx = toTransactions([
  { date: '2026-01-03', category: 'Groceries', description: 'A', amount: 10 },
  { date: '2026-01-10', category: 'Dining', description: 'B', amount: 20 },
  { date: '2026-01-20', category: 'Groceries', description: 'C', amount: 5 },
]);

test('identity query returns all rows in one ungrouped group', () => {
  const r = applyQuery(tx);
  assert.equal(r.grouped, false);
  assert.equal(r.groups.length, 1);
  assert.equal(r.groups[0].rows.length, 3);
  assert.equal(r.total.toNumber(), 35);
});

test('filters by date range', () => {
  const r = applyQuery(tx, { filters: { from: '2026-01-05', to: '2026-01-15' } });
  assert.equal(r.groups[0].rows.length, 1);
  assert.equal(r.total.toNumber(), 20);
});

test('filters by category', () => {
  const r = applyQuery(tx, { filters: { category: 'Groceries' } });
  assert.equal(r.groups[0].rows.length, 2);
  assert.equal(r.total.toNumber(), 15);
});

test('filters by minimum amount', () => {
  const r = applyQuery(tx, { filters: { minCents: 700 } });
  assert.equal(r.groups[0].rows.length, 2);
  assert.equal(r.total.toNumber(), 30);
});

test('filters combine', () => {
  const r = applyQuery(tx, { filters: { category: 'Groceries', minCents: 700 } });
  assert.equal(r.groups[0].rows.length, 1);
  assert.equal(r.total.toNumber(), 10);
});

test('sorts by amount ascending and descending', () => {
  const asc = applyQuery(tx, { sortBy: 'amount' }).groups[0].rows.map((t) => t.amount.toNumber());
  assert.deepEqual(asc, [5, 10, 20]);
  const desc = applyQuery(tx, { sortBy: 'amount', desc: true }).groups[0].rows.map((t) =>
    t.amount.toNumber(),
  );
  assert.deepEqual(desc, [20, 10, 5]);
});

test('an unknown sort key throws', () => {
  assert.throws(() => applyQuery(tx, { sortBy: 'nonsense' }), /Unknown sort key/);
});

test('groups by category with subtotals', () => {
  const r = applyQuery(tx, { groupBy: 'category' });
  assert.equal(r.grouped, true);
  assert.equal(r.groups.length, 2);
  const groceries = r.groups.find((g) => g.key === 'Groceries');
  assert.equal(groceries.subtotal.toNumber(), 15);
  assert.equal(r.total.toNumber(), 35);
});
