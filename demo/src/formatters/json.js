// Renders a QueryResult as pretty-printed JSON.
export class JsonFormatter {
  format(title, result) {
    const payload = {
      title,
      grouped: result.grouped,
      groups: result.groups.map((g) => ({
        key: g.key,
        rows: g.rows.map((t) => ({
          date: t.date,
          category: t.category,
          description: t.description,
          amount: t.amount.toNumber(),
        })),
        subtotal: g.subtotal.toNumber(),
      })),
      total: result.total.toNumber(),
    };
    return JSON.stringify(payload, null, 2);
  }
}
