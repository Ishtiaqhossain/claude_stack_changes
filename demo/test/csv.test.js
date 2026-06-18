import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CsvFormatter } from '../src/formatter.js';

test('CsvFormatter emits a header row and one line per row', () => {
  const csv = new CsvFormatter();
  assert.equal(
    csv.format('Sales', [
      { label: 'Apples', value: 120 },
      { label: 'Oranges', value: 90 },
    ]),
    'label,value\nApples,120\nOranges,90',
  );
});
