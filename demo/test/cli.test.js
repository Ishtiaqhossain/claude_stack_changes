import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { parseArgs } from '../src/index.js';

const run = (...args) =>
  execFileSync('node', ['src/index.js', ...args], { encoding: 'utf8' }).trim();

test('parseArgs reads every flag', () => {
  const o = parseArgs([
    '--format', 'csv',
    '--from', '2026-01-01',
    '--to', '2026-01-31',
    '--category', 'Dining',
    '--min', '5',
    '--group-by', 'category',
  ]);
  assert.equal(o.format, 'csv');
  assert.equal(o.filters.from, '2026-01-01');
  assert.equal(o.filters.to, '2026-01-31');
  assert.equal(o.filters.category, 'Dining');
  assert.equal(o.filters.minCents, 500);
  assert.equal(o.groupBy, 'category');
});

test('CLI default prints a text report with the grand total', () => {
  const out = run();
  assert.match(out, /^Expense Report/);
  assert.match(out, /TOTAL {2}\$759\.09/);
});

test('CLI --format csv emits a CSV header', () => {
  assert.equal(run('--format', 'csv').split('\n')[0], 'date,category,description,amount');
});

test('CLI --group-by category shows groups and subtotals', () => {
  const out = run('--group-by', 'category');
  assert.match(out, /\[Groceries\]/);
  assert.match(out, /subtotal/);
});

test('CLI --category filters the rows', () => {
  // CSV header + the four Dining rows
  assert.equal(run('--format', 'csv', '--category', 'Dining').split('\n').length, 5);
});

test('CLI --sort amount --desc orders rows high to low', () => {
  const rows = run('--format', 'csv', '--sort', 'amount', '--desc').split('\n').slice(1);
  const amounts = rows.map((r) => Number(r.split(',')[3]));
  const sorted = [...amounts].sort((a, b) => b - a);
  assert.deepEqual(amounts, sorted);
});

test('CLI --budget --format summary reports over/under budget', () => {
  const out = run('--budget', '--format', 'summary');
  assert.match(out, /Entertainment: \$94\.00 of \$80\.00 \(118%\) — OVER/);
  assert.match(out, /TOTAL {2}\$759\.09/);
});
