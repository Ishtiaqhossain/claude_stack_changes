import { TextFormatter } from './text.js';
import { CsvFormatter } from './csv.js';
import { JsonFormatter } from './json.js';
import { HtmlFormatter } from './html.js';
import { MarkdownFormatter } from './markdown.js';
import { TableFormatter } from './table.js';
import { SummaryFormatter } from './summary.js';

// Registry mapping a format name to a formatter. New output formats register
// here; callers look one up by name.
const formatters = {
  text: new TextFormatter(),
  csv: new CsvFormatter(),
  json: new JsonFormatter(),
  html: new HtmlFormatter(),
  markdown: new MarkdownFormatter(),
  table: new TableFormatter(),
  summary: new SummaryFormatter(),
};

export function getFormatter(name) {
  const formatter = formatters[name];
  if (!formatter) {
    throw new Error(`Unknown format: ${name} (have: ${formatNames().join(', ')})`);
  }
  return formatter;
}

export function registerFormatter(name, formatter) {
  formatters[name] = formatter;
}

export function formatNames() {
  return Object.keys(formatters);
}
