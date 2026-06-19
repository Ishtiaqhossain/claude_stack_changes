// Builds a plain-text expense report.
//
// Today, text is the only output format and the totalling logic lives inline
// right here. Adding more formats, filtering, or grouping by changing this one
// function would make it sprawl — which is exactly why the feature is landed as
// a refactor-first stack (model -> formatter seam -> query pipeline -> features).
export function renderReport(title, transactions) {
  const lines = [title, '='.repeat(title.length)];

  let total = 0;
  for (const t of transactions) {
    total += t.amount;
    lines.push(`${t.date}  ${t.category}  ${t.description}  $${t.amount.toFixed(2)}`);
  }

  lines.push('-'.repeat(title.length));
  lines.push(`TOTAL  $${total.toFixed(2)}`);
  return lines.join('\n');
}
