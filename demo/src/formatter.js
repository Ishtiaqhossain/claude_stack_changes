// A Formatter turns a report's title and rows into a string.
export class TextFormatter {
  format(title, rows) {
    const lines = [title, '='.repeat(title.length)];
    for (const row of rows) lines.push(`${row.label}: ${row.value}`);
    return lines.join('\n');
  }
}

// Registry mapping a format name to a formatter instance. New output
// formats register here; callers look one up by name. Today only 'text'
// is registered, so behavior is unchanged.
const formatters = { text: new TextFormatter() };

export function getFormatter(name) {
  const formatter = formatters[name];
  if (!formatter) throw new Error(`Unknown format: ${name}`);
  return formatter;
}

export function registerFormatter(name, formatter) {
  formatters[name] = formatter;
}
