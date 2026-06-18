// A Formatter turns a report's title and rows into a string.
export class TextFormatter {
  format(title, rows) {
    const lines = [title, '='.repeat(title.length)];
    for (const row of rows) lines.push(`${row.label}: ${row.value}`);
    return lines.join('\n');
  }
}

export class CsvFormatter {
  format(title, rows) {
    const lines = ['label,value'];
    for (const row of rows) lines.push(`${row.label},${row.value}`);
    return lines.join('\n');
  }
}

// Registry mapping a format name to a formatter instance.
const formatters = { text: new TextFormatter() };

export function getFormatter(name) {
  const formatter = formatters[name];
  if (!formatter) throw new Error(`Unknown format: ${name}`);
  return formatter;
}

export function registerFormatter(name, formatter) {
  formatters[name] = formatter;
}

// Feature flag: CSV export stays off until it is wired into the CLI (next PR).
// With the flag off, 'csv' is not registered and existing behavior is unchanged.
if (process.env.ENABLE_CSV_EXPORT === 'true') {
  registerFormatter('csv', new CsvFormatter());
}
