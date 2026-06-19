// Renders a QueryResult as plain text. With an ungrouped result this produces
// exactly the original report layout, so the seam is behavior-preserving.
export class TextFormatter {
  format(title, result) {
    const lines = [title, '='.repeat(title.length)];

    for (const group of result.groups) {
      if (result.grouped) lines.push('', `[${group.key}]`);
      for (const t of group.rows) {
        lines.push(`${t.date}  ${t.category}  ${t.description}  ${t.amount.toString()}`);
      }
      if (result.grouped) lines.push(`  subtotal  ${group.subtotal.toString()}`);
    }

    lines.push('-'.repeat(title.length));
    lines.push(`TOTAL  ${result.total.toString()}`);
    return lines.join('\n');
  }
}
