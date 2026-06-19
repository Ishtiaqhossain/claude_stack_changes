import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { parse, parseAll } from './parse.js';
import { convert } from './convert.js';
import { format } from './format.js';
import { suggest } from './suggest.js';
import { listUnits } from './list.js';

// Convert a single "<value> <from> to <to>" expression to a formatted string.
export function run(input, options = {}) {
  const { value, from, to } = parse(input);
  return format(convert(value, from, to), to, options);
}

// Convert one or more ';'-separated expressions; returns one line each.
export function runAll(input, options = {}) {
  return parseAll(input)
    .map(({ value, from, to }) => format(convert(value, from, to), to, options))
    .join('\n');
}

function main(argv) {
  const args = [...argv];

  if (args.includes('--list')) {
    console.log(listUnits());
    return 0;
  }

  let precision = 4;
  const pi = args.indexOf('--precision');
  if (pi !== -1) {
    precision = Number(args[pi + 1]);
    args.splice(pi, 2);
  }

  const input = args.join(' ');
  try {
    console.log(runAll(input, { precision }));
    return 0;
  } catch (err) {
    let message = err.message;
    const unknown = /Unknown unit: (\w+)/.exec(message);
    if (unknown) {
      const hint = suggest(unknown[1]);
      if (hint) message += ` (did you mean "${hint}"?)`;
    }
    console.error(message);
    return 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(main(process.argv.slice(2)));
}
