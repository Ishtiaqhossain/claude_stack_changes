import { TextFormatter, CsvFormatter } from './formatter.js';

// A Report holds rows and renders them in a chosen format.
export class Report {
  constructor(title, rows) {
    this.title = title;
    this.rows = rows; // array of { label, value }
  }

  render(format = 'text') {
    const formatter = format === 'csv' ? new CsvFormatter() : new TextFormatter();
    return formatter.format(this.title, this.rows);
  }
}
