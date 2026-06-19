import { Money } from './money.js';

// Per-category monthly budgets (in dollars). A category with no entry is
// treated as unbudgeted.
export const DEFAULT_BUDGETS = {
  Groceries: 200,
  Dining: 150,
  Transport: 120,
  Utilities: 200,
  Entertainment: 80,
};

// Evaluate spend against a budget table. Returns one row per budgeted category
// plus any category that has spend, with the status a report can render:
//
//   { category, spent, budget, remaining, overBudget, percent }
export function evaluateBudgets(transactions, budgets = DEFAULT_BUDGETS) {
  const spentByCategory = new Map();
  for (const t of transactions) {
    const prev = spentByCategory.get(t.category) ?? Money.zero();
    spentByCategory.set(t.category, prev.plus(t.amount));
  }

  const categories = new Set([...Object.keys(budgets), ...spentByCategory.keys()]);

  return [...categories]
    .sort((a, b) => a.localeCompare(b))
    .map((category) => {
      const spent = spentByCategory.get(category) ?? Money.zero();
      const budget = Money.fromDollars(budgets[category] ?? 0);
      const remaining = budget.minus(spent);
      return {
        category,
        spent,
        budget,
        remaining,
        overBudget: spent.isGreaterThan(budget) && budget.cents > 0,
        percent: budget.cents > 0 ? spent.percentOf(budget) : null,
      };
    });
}
