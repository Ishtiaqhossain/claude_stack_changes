import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateReport } from '../src/report.js';
import { formatNames } from '../src/formatters/index.js';

const fixture = [
  { date: '2026-01-03', category: 'Groceries', description: 'Apples', amount: 10 },
  { date: '2026-01-10', category: 'Dining', description: 'Lunch', amount: 20 },
  { date: '2026-01-20', category: 'Groceries', description: 'Bread', amount: 5 },
];

test('golden: aligned ASCII table', () => {
  const sep = '----------  ---------  -----------  ------';
  assert.equal(
    generateReport('Expenses', fixture, { format: 'table' }),
    [
      'Expenses',
      '',
      'Date        Category   Description  Amount',
      sep,
      '2026-01-03  Groceries  Apples       $10.00',
      '2026-01-10  Dining     Lunch        $20.00',
      '2026-01-20  Groceries  Bread        $5.00',
      sep,
      ' '.repeat(23) + 'TOTAL' + ' '.repeat(8) + '$35.00',
    ].join('\n'),
  );
});

test('golden: styled HTML document', () => {
  assert.equal(
    generateReport('Expenses', fixture, { format: 'html' }),
    [
      '<!doctype html>',
      '<meta charset="utf-8">',
      '<title>Expenses</title>',
      '<style>',
      '  body { font-family: system-ui, sans-serif; margin: 2rem; }',
      '  table { border-collapse: collapse; width: 100%; }',
      '  th, td { border: 1px solid #ddd; padding: 6px 10px; text-align: left; }',
      '  td.amount { text-align: right; font-variant-numeric: tabular-nums; }',
      '  tr.group th { background: #f0f0f0; }',
      '  tr.subtotal td, tr.total td { font-weight: 600; }',
      '</style>',
      '<h1>Expenses</h1>',
      '<table>',
      '    <tr><th>Date</th><th>Category</th><th>Description</th><th>Amount</th></tr>',
      '    <tr><td>2026-01-03</td><td>Groceries</td><td>Apples</td><td class="amount">$10.00</td></tr>',
      '    <tr><td>2026-01-10</td><td>Dining</td><td>Lunch</td><td class="amount">$20.00</td></tr>',
      '    <tr><td>2026-01-20</td><td>Groceries</td><td>Bread</td><td class="amount">$5.00</td></tr>',
      '    <tr class="total"><td colspan="3">Total</td><td class="amount">$35.00</td></tr>',
      '</table>',
    ].join('\n'),
  );
});

test('every format renders a stable, non-empty string', () => {
  for (const name of formatNames()) {
    const once = generateReport('Expenses', fixture, { format: name });
    const twice = generateReport('Expenses', fixture, { format: name });
    assert.ok(once.length > 0, `${name} produced output`);
    assert.equal(once, twice, `${name} is deterministic`);
  }
});
