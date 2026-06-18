import { Money } from './money.js';

// Sum a list of transactions into a Money total.
function sum(rows) {
  return rows.reduce((acc, t) => acc.plus(t.amount), Money.zero());
}

// Turn a list of Transactions into a QueryResult that the report renders:
//
//   { groups: [ { key, rows, subtotal } ], total, grouped }
//
// For now this is the identity query: a single group (key=null) holding every
// row, in original order. Filtering, sorting, and grouping plug in here in
// later changes; today the result is byte-for-byte the old flat list.
export function applyQuery(transactions, options = {}) {
  const rows = transactions;
  const groups = [{ key: null, rows, subtotal: sum(rows) }];
  return { groups, total: sum(rows), grouped: false };
}
