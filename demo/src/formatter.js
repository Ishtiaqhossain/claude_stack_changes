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
