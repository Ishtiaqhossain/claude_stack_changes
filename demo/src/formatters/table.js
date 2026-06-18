// Renders a QueryResult as a fixed-width aligned ASCII table.
export class TableFormatter {
  format(title, result) {
    const rows = result.groups.flatMap((g) => g.rows);
    const headers = ['Date', 'Category', 'Description', 'Amount'];
    const data = rows.map((t) => [t.date, t.category, t.description, t.amount.toString()]);

    const widths = headers.map((h, i) =>
      Math.max(h.length, ...data.map((r) => r[i].length), 0),
    );
    const fmtRow = (cols) => cols.map((c, i) => c.padEnd(widths[i])).join('  ').trimEnd();
    const sep = widths.map((w) => '-'.repeat(w)).join('  ');

    const lines = [title, '', fmtRow(headers), sep];
    for (const row of data) lines.push(fmtRow(row));
    lines.push(sep);
    lines.push(fmtRow(['', '', 'TOTAL', result.total.toString()]));
    return lines.join('\n');
  }
}
