import { getFormatter } from './formatter.js';

// A Report holds rows and renders them. Rendering is delegated to a
// formatter looked up from the registry; 'text' remains the default, so
// public behavior is unchanged.
export class Report {
  constructor(title, rows) {
    this.title = title;
    this.rows = rows; // array of { label, value }
  }

  render(format = 'text') {
    return getFormatter(format).format(this.title, this.rows);
  }
}
