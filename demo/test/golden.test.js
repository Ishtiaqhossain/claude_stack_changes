import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateReport } from '../src/report.js';

const fixture = [
  { date: '2026-01-03', category: 'Groceries', description: 'Apples', amount: 10 },
  { date: '2026-01-10', category: 'Dining', description: 'Lunch', amount: 20 },
  { date: '2026-01-20', category: 'Groceries', description: 'Bread', amount: 5 },
];

test('golden: grouped text report', () => {
  assert.equal(
    generateReport('Expenses', fixture, { format: 'text', groupBy: 'category' }),
    [
      'Expenses',
      '========',
      '',
      '[Groceries]',
      '2026-01-03  Groceries  Apples  $10.00',
      '2026-01-20  Groceries  Bread  $5.00',
      '  subtotal  $15.00',
      '',
      '[Dining]',
      '2026-01-10  Dining  Lunch  $20.00',
      '  subtotal  $20.00',
      '--------',
      'TOTAL  $35.00',
    ].join('\n'),
  );
});

test('golden: markdown report', () => {
  assert.equal(
    generateReport('Expenses', fixture, { format: 'markdown' }),
    [
      '# Expenses',
      '',
      '| Date | Category | Description | Amount |',
      '| --- | --- | --- | --- |',
      '| 2026-01-03 | Groceries | Apples | $10.00 |',
      '| 2026-01-10 | Dining | Lunch | $20.00 |',
      '| 2026-01-20 | Groceries | Bread | $5.00 |',
      '',
      '**Total:** $35.00',
    ].join('\n'),
  );
});
