import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyQuery } from '../src/query.js';
import { toTransactions } from '../src/transaction.js';
import { generateReport } from '../src/report.js';

test('empty input yields a zero total in one empty group', () => {
  const r = applyQuery([]);
  assert.equal(r.total.toNumber(), 0);
  assert.equal(r.groups.length, 1);
  assert.equal(r.groups[0].rows.length, 0);
});

test('a filter that matches nothing still renders a valid text report', () => {
  const tx = toTransactions([
    { date: '2026-01-03', category: 'Groceries', description: 'Apples', amount: 10 },
  ]);
  const out = generateReport('Expenses', tx, { filters: { category: 'Nope' } });
  assert.match(out, /TOTAL {2}\$0\.00/);
});

test('an unknown sort key throws', () => {
  assert.throws(
    () => applyQuery([], { sortBy: 'nonsense' }),
    /Unknown sort key/,
  );
});
