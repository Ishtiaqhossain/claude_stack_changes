// A Report holds rows and renders them. Today it only renders plain text.
export class Report {
  constructor(title, rows) {
    this.title = title;
    this.rows = rows; // array of { label, value }
  }

  render() {
    const lines = [this.title, '='.repeat(this.title.length)];
    for (const row of this.rows) {
      lines.push(`${row.label}: ${row.value}`);
    }
    return lines.join('\n');
  }
}
