import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateReport } from '../src/report.js';

const fixture = [
  { date: '2026-01-03', category: 'Groceries', description: 'Apples', amount: 10 },
  { date: '2026-01-10', category: 'Dining', description: 'Lunch', amount: 20 },
  { date: '2026-01-20', category: 'Groceries', description: 'Bread', amount: 5 },
];

test('golden: csv (ungrouped)', () => {
  assert.equal(
    generateReport('Expenses', fixture, { format: 'csv' }),
    [
      'date,category,description,amount',
      '2026-01-03,Groceries,Apples,10.00',
      '2026-01-10,Dining,Lunch,20.00',
      '2026-01-20,Groceries,Bread,5.00',
    ].join('\n'),
  );
});

test('golden: csv (grouped flattens groups in group order)', () => {
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

test('golden: summary (no budget) lists category totals', () => {
  assert.equal(
    generateReport('Expenses', fixture, { format: 'summary' }),
    ['Expenses', '========', 'Dining: $20.00', 'Groceries: $15.00', '--------', 'TOTAL  $35.00'].join('\n'),
  );
});

test('golden: markdown (grouped) adds subtotal rows', () => {
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

test('golden: json (ungrouped) has the expected shape', () => {
  assert.equal(
    generateReport('Expenses', fixture, { format: 'json' }),
    [
      '{',
      '  "title": "Expenses",',
      '  "grouped": false,',
      '  "groups": [',
      '    {',
      '      "key": null,',
      '      "rows": [',
      '        {',
      '          "date": "2026-01-03",',
      '          "category": "Groceries",',
      '          "description": "Apples",',
      '          "amount": 10',
      '        },',
      '        {',
      '          "date": "2026-01-10",',
      '          "category": "Dining",',
      '          "description": "Lunch",',
      '          "amount": 20',
      '        },',
      '        {',
      '          "date": "2026-01-20",',
      '          "category": "Groceries",',
      '          "description": "Bread",',
      '          "amount": 5',
      '        }',
      '      ],',
      '      "subtotal": 35',
      '    }',
      '  ],',
      '  "total": 35',
      '}',
    ].join('\n'),
  );
});
