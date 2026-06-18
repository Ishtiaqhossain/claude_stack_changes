// Renders a QueryResult as a minimal self-contained, styled HTML document.
export class HtmlFormatter {
  format(title, result) {
    const esc = (s) =>
      String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const bodyRows = [];
    for (const group of result.groups) {
      if (result.grouped) {
        bodyRows.push(`    <tr class="group"><th colspan="4">${esc(group.key)}</th></tr>`);
      }
      for (const t of group.rows) {
        bodyRows.push(
          `    <tr><td>${esc(t.date)}</td><td>${esc(t.category)}</td>` +
            `<td>${esc(t.description)}</td><td class="amount">${esc(t.amount.toString())}</td></tr>`,
        );
      }
      if (result.grouped) {
        bodyRows.push(
          `    <tr class="subtotal"><td colspan="3">Subtotal</td>` +
            `<td class="amount">${esc(group.subtotal.toString())}</td></tr>`,
        );
      }
    }

    return [
      '<!doctype html>',
      '<meta charset="utf-8">',
      `<title>${esc(title)}</title>`,
      '<style>',
      '  body { font-family: system-ui, sans-serif; margin: 2rem; }',
      '  table { border-collapse: collapse; width: 100%; }',
      '  th, td { border: 1px solid #ddd; padding: 6px 10px; text-align: left; }',
      '  td.amount { text-align: right; font-variant-numeric: tabular-nums; }',
      '  tr.group th { background: #f0f0f0; }',
      '  tr.subtotal td, tr.total td { font-weight: 600; }',
      '</style>',
      `<h1>${esc(title)}</h1>`,
      '<table>',
      '    <tr><th>Date</th><th>Category</th><th>Description</th><th>Amount</th></tr>',
      ...bodyRows,
      `    <tr class="total"><td colspan="3">Total</td>` +
        `<td class="amount">${esc(result.total.toString())}</td></tr>`,
      '</table>',
    ].join('\n');
  }
}
