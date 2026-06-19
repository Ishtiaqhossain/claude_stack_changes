import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Transaction, toTransactions } from '../src/transaction.js';
import { Money } from '../src/money.js';

test('Transaction converts a raw dollar amount to Money', () => {
  const t = new Transaction({ date: '2026-01-01', category: 'X', description: 'y', amount: 12.5 });
  assert.ok(t.amount instanceof Money);
  assert.equal(t.amount.cents, 1250);
});

test('Transaction keeps an existing Money amount', () => {
  const t = new Transaction({
    date: '2026-01-01',
    category: 'X',
    description: 'y',
    amount: new Money(999),
  });
  assert.equal(t.amount.cents, 999);
});

test('toTransactions is idempotent', () => {
  const once = toTransactions([{ date: '2026-01-01', category: 'X', description: 'y', amount: 1 }]);
  const twice = toTransactions(once);
  assert.equal(twice[0], once[0]);
  assert.ok(twice[0] instanceof Transaction);
});
