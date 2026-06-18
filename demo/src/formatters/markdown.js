// Renders a QueryResult as a Markdown document with a table.
export class MarkdownFormatter {
  format(title, result) {
    const lines = [
      `# ${title}`,
      '',
      '| Date | Category | Description | Amount |',
      '| --- | --- | --- | --- |',
    ];

    for (const group of result.groups) {
      for (const t of group.rows) {
        lines.push(`| ${t.date} | ${t.category} | ${t.description} | ${t.amount.toString()} |`);
      }
      if (result.grouped) {
        lines.push(`| | | **${group.key} subtotal** | **${group.subtotal.toString()}** |`);
      }
    }

    lines.push('', `**Total:** ${result.total.toString()}`);
    return lines.join('\n');
  }
}
