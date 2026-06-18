// Renders a QueryResult as CSV (one row per transaction; groups are flattened).
export class CsvFormatter {
  format(title, result) {
    const lines = ['date,category,description,amount'];
    for (const group of result.groups) {
      for (const t of group.rows) {
        lines.push(`${t.date},${t.category},${t.description},${t.amount.toNumber().toFixed(2)}`);
      }
    }
    return lines.join('\n');
  }
}
