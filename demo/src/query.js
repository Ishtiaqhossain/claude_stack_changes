import { Money } from './money.js';

// Sum a list of transactions into a Money total.
function sum(rows) {
  return rows.reduce((acc, t) => acc.plus(t.amount), Money.zero());
}

const COMPARATORS = {
  date: (a, b) => a.date.localeCompare(b.date),
  amount: (a, b) => a.amount.compareTo(b.amount),
  category: (a, b) => a.category.localeCompare(b.category),
  description: (a, b) => a.description.localeCompare(b.description),
};

// Apply filtering, optional sorting, and optional grouping to a list of
// Transactions, producing a QueryResult that formatters render:
//
//   { groups: [ { key, rows, subtotal } ], total, grouped }
//
// With no filters, no sort, and no groupBy, the result is a single group
// (key=null) holding every row in original order — the identity query, which
// is byte-for-byte the old behavior.
export function applyQuery(transactions, options = {}) {
  const { filters = {}, groupBy = null, sortBy = null, desc = false } = options;

  let rows = transactions;
  if (filters.from) rows = rows.filter((t) => t.date >= filters.from);
  if (filters.to) rows = rows.filter((t) => t.date <= filters.to);
  if (filters.category) rows = rows.filter((t) => t.category === filters.category);
  if (filters.minCents != null) rows = rows.filter((t) => t.amount.cents >= filters.minCents);

  if (sortBy) {
    const cmp = COMPARATORS[sortBy];
    if (!cmp) throw new Error(`Unknown sort key: ${sortBy}`);
    rows = [...rows].sort((a, b) => (desc ? -cmp(a, b) : cmp(a, b)));
  }

  let groups;
  if (groupBy === 'category') {
    const byKey = new Map();
    for (const t of rows) {
      if (!byKey.has(t.category)) byKey.set(t.category, []);
      byKey.get(t.category).push(t);
    }
    groups = [...byKey.entries()].map(([key, groupRows]) => ({
      key,
      rows: groupRows,
      subtotal: sum(groupRows),
    }));
  } else {
    groups = [{ key: null, rows, subtotal: sum(rows) }];
  }

  return { groups, total: sum(rows), grouped: groupBy === 'category' };
}
