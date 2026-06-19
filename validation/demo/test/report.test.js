import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderReport } from '../src/report.js';

const fixture = [
  { date: '2026-01-03', category: 'Groceries', description: 'Supermarket', amount: 54.20 },
  { date: '2026-01-05', category: 'Transport', description: 'Bus pass', amount: 30.00 },
];

test('renders a plain-text report with a total', () => {
  assert.equal(
    renderReport('Expenses', fixture),
    [
      'Expenses',
      '========',
      '2026-01-03  Groceries  Supermarket  $54.20',
      '2026-01-05  Transport  Bus pass  $30.00',
      '--------',
      'TOTAL  $84.20',
    ].join('\n'),
  );
});
