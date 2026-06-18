import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { transactions } from './data.js';
import { generateReport } from './report.js';

// Parse CLI flags:
//   --format text|csv|json|html|markdown|table|summary
//   --from YYYY-MM-DD   --to YYYY-MM-DD
//   --category NAME     --min DOLLARS
//   --sort date|amount|category|description   --desc
//   --group-by category
//   --budget
export function parseArgs(argv) {
  const options = { format: 'text', filters: {}, groupBy: null, sortBy: null, desc: false, budget: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--format') options.format = argv[++i];
    else if (arg === '--from') options.filters.from = argv[++i];
    else if (arg === '--to') options.filters.to = argv[++i];
    else if (arg === '--category') options.filters.category = argv[++i];
    else if (arg === '--min') options.filters.minCents = Math.round(Number(argv[++i]) * 100);
    else if (arg === '--sort') options.sortBy = argv[++i];
    else if (arg === '--desc') options.desc = true;
    else if (arg === '--group-by') options.groupBy = argv[++i];
    else if (arg === '--budget') options.budget = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return options;
}

// Only run when invoked as the entry point, so tests can import parseArgs.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const options = parseArgs(process.argv.slice(2));
  console.log(generateReport('Expense Report', transactions, options));
}
