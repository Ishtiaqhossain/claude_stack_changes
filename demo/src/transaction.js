import { Money } from './money.js';

// A single expense. `amount` is always a Money once it is a Transaction; raw
// input (plain numbers from data.js or JSON) is converted at the boundary.
export class Transaction {
  constructor({ date, category, description, amount }) {
    this.date = date;
    this.category = category;
    this.description = description;
    this.amount = amount instanceof Money ? amount : Money.fromDollars(amount);
  }
}

// Convert raw rows into Transactions. Idempotent: already-converted rows pass
// through unchanged, so callers never have to care which they hold.
export function toTransactions(raw) {
  return raw.map((r) => (r instanceof Transaction ? r : new Transaction(r)));
}
