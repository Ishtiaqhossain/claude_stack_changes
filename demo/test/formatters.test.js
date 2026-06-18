import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyQuery } from '../src/query.js';
import { toTransactions } from '../src/transaction.js';
import { getFormatter, formatNames } from '../src/formatters/index.js';

const tx = toTransactions([
  { date: '2026-01-03', category: 'Groceries', description: 'Apples', amount: 10 },
  { date: '2026-01-10', category: 'Dining', description: 'Lunch', amount: 20 },
]);
const result = applyQuery(tx);

test('registry exposes all output formats', () => {
  assert.deepEqual(formatNames().sort(), [
    'csv', 'html', 'json', 'markdown', 'summary', 'table', 'text',
  ]);
});

test('csv has a header and one row per transaction', () => {
  const csv = getFormatter('csv').format('X', result);
  const lines = csv.split('\n');
  assert.equal(lines[0], 'date,category,description,amount');
  assert.equal(lines.length, 3);
  assert.match(csv, /2026-01-03,Groceries,Apples,10\.00/);
});

test('json carries the right totals and shape', () => {
  const json = JSON.parse(getFormatter('json').format('X', result));
  assert.equal(json.total, 30);
  assert.equal(json.grouped, false);
  assert.equal(json.groups[0].rows.length, 2);
});

test('markdown has a table header and a total', () => {
  const md = getFormatter('markdown').format('X', result);
  assert.match(md, /^# X/);
  assert.match(md, /\| Date \| Category \| Description \| Amount \|/);
  assert.match(md, /\*\*Total:\*\* \$30\.00/);
});

test('html escapes special characters and includes a total', () => {
  const escTx = toTransactions([
    { date: '2026-01-03', category: 'A&B', description: '<x>', amount: 1 },
  ]);
  const html = getFormatter('html').format('T', applyQuery(escTx));
  assert.match(html, /A&amp;B/);
  assert.match(html, /&lt;x&gt;/);
  assert.match(html, /Total/);
});

test('unknown format throws', () => {
  assert.throws(() => getFormatter('pdf'), /Unknown format/);
});
