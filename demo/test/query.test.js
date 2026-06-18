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
  assert.equal(r.groups[0].key, null);
  assert.equal(r.groups[0].rows.length, 3);
  assert.equal(r.total.toNumber(), 35);
  assert.equal(r.groups[0].subtotal.toNumber(), 35);
});
