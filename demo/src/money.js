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

  minus(other) {
    return new Money(this.cents - other.cents);
  }

  times(factor) {
    return new Money(this.cents * factor);
  }

  // This as a percentage of `whole` (0 when whole is zero), rounded to an int.
  percentOf(whole) {
    if (whole.cents === 0) return 0;
    return Math.round((this.cents / whole.cents) * 100);
  }

  isNegative() {
    return this.cents < 0;
  }

  isGreaterThan(other) {
    return this.cents > other.cents;
  }

  // Sort comparator helper: negative / zero / positive.
  compareTo(other) {
    return this.cents - other.cents;
  }

  toNumber() {
    return this.cents / 100;
  }

  toString() {
    const sign = this.cents < 0 ? '-' : '';
    return `${sign}$${(Math.abs(this.cents) / 100).toFixed(2)}`;
  }
}
