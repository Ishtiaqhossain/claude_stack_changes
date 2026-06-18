# expense-report

A small command-line **expense report** generator — the sample project for the
[`splitting-changes-into-prs`](../splitting-changes-into-prs/SKILL.md) skill.

It starts life (on `main`) as a naive, text-only report. The feature we then land —
**multi-format export + filtering + sorting + grouped subtotals + per-category budgets** — is
1000+ lines as a single monolith, and is also landed as a **refactor-first stack** of
single-thesis PRs. Compare the two on the repo's Pull Requests tab.

## Run it

```bash
cd demo
npm run build   # syntax-check + run the entry point
npm test        # node --test (unit + golden + integration)

node src/index.js                                  # plain text report
node src/index.js --format markdown                # Markdown
node src/index.js --format csv --category Dining    # CSV, filtered
node src/index.js --group-by category               # grouped, with subtotals
node src/index.js --sort amount --desc              # sorted high to low
node src/index.js --budget --format summary         # budget status per category
```

## Flags

| Flag | Meaning |
|------|---------|
| `--format` | `text` (default), `csv`, `json`, `html`, `markdown`, `table`, `summary` |
| `--from` / `--to` | inclusive date range (`YYYY-MM-DD`) |
| `--category` | keep only one category |
| `--min` | keep rows at or above an amount (dollars) |
| `--sort` | `date`, `amount`, `category`, `description` (add `--desc` to reverse) |
| `--group-by` | `category` — adds per-group subtotals |
| `--budget` | evaluate spend against per-category budgets |

## Structure

```
src/money.js            integer-cent Money value type
src/transaction.js      Transaction model + raw -> Transaction conversion
src/query.js            filter + sort + group pipeline (identity by default)
src/budgets.js          per-category budget evaluation
src/formatters/         one file per output format + a registry
src/report.js           orchestrates query -> formatter
src/index.js            CLI argument parsing
```
