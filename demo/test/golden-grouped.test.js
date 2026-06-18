import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateReport } from '../src/report.js';

const fixture = [
  { date: '2026-01-03', category: 'Groceries', description: 'Apples', amount: 10 },
  { date: '2026-01-10', category: 'Dining', description: 'Lunch', amount: 20 },
  { date: '2026-01-20', category: 'Groceries', description: 'Bread', amount: 5 },
];

test('golden: grouped text report with subtotals', () => {
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

test('golden: grouped csv flattens groups in group order', () => {
  assert.equal(
    generateReport('Expenses', fixture, { format: 'csv', groupBy: 'category' }),
    [
      'date,category,description,amount',
      '2026-01-03,Groceries,Apples,10.00',
      '2026-01-20,Groceries,Bread,5.00',
      '2026-01-10,Dining,Lunch,20.00',
    ].join('\n'),
  );
});

test('golden: grouped markdown adds subtotal rows', () => {
  assert.equal(
    generateReport('Expenses', fixture, { format: 'markdown', groupBy: 'category' }),
    [
      '# Expenses',
      '',
      '| Date | Category | Description | Amount |',
      '| --- | --- | --- | --- |',
      '| 2026-01-03 | Groceries | Apples | $10.00 |',
      '| 2026-01-20 | Groceries | Bread | $5.00 |',
      '| | | **Groceries subtotal** | **$15.00** |',
      '| 2026-01-10 | Dining | Lunch | $20.00 |',
      '| | | **Dining subtotal** | **$20.00** |',
      '',
      '**Total:** $35.00',
    ].join('\n'),
  );
});

test('golden: sorted by amount descending (ungrouped text)', () => {
  const out = generateReport('Expenses', fixture, { format: 'csv', sortBy: 'amount', desc: true });
  assert.deepEqual(
    out.split('\n').slice(1).map((l) => l.split(',')[2]),
    ['Lunch', 'Apples', 'Bread'],
  );
});
