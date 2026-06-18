import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Report } from '../src/report.js';

test('renders a report as plain text', () => {
  const report = new Report('Sales', [
    { label: 'Apples', value: 120 },
    { label: 'Oranges', value: 90 },
  ]);
  assert.equal(report.render(), 'Sales\n=====\nApples: 120\nOranges: 90');
});
