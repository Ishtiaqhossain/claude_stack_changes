// Parse an expression like "10 km to mi" or "100 C to F" into { value, from, to }.
const EXPR = /^\s*(-?\d+(?:\.\d+)?)\s+([A-Za-z0-9]+)\s+to\s+([A-Za-z0-9]+)\s*$/;

export function parse(input) {
  const match = EXPR.exec(input);
  if (!match) {
    throw new Error(`Cannot parse expression: "${input}" (expected "<value> <from> to <to>")`);
  }
  return { value: Number(match[1]), from: match[2], to: match[3] };
}

// Parse several expressions separated by ';' or newlines into an array.
export function parseAll(input) {
  return input
    .split(/[;\n]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map(parse);
}
