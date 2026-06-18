// Money stored as an integer number of cents, to avoid the floating-point
// rounding you get when you add up dollar amounts as plain numbers.
export class Money {
  constructor(cents) {
    this.cents = Math.round(cents);
  }

  static fromDollars(dollars) {
    return new Money(Math.round(dollars * 100));
  }

  static zero() {
    return new Money(0);
  }

  plus(other) {
    return new Money(this.cents + other.cents);
  }

  // Sort comparator helper: negative / zero / positive.
  compareTo(other) {
    return this.cents - other.cents;
  }

  toNumber() {
    return this.cents / 100;
  }

  toString() {
    return `$${(this.cents / 100).toFixed(2)}`;
  }
}
