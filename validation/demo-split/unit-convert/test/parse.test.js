import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parse, parseAll } from '../src/parse.js';

test('parses a length expression', () => {
  assert.deepEqual(parse('10 km to mi'), { value: 10, from: 'km', to: 'mi' });
});

test('parses a temperature expression', () => {
  assert.deepEqual(parse('100 C to F'), { value: 100, from: 'C', to: 'F' });
});

test('parses decimals and negatives', () => {
  assert.deepEqual(parse('-40.5 C to F'), { value: -40.5, from: 'C', to: 'F' });
});

test('parses units with digits', () => {
  assert.deepEqual(parse('2 m2 to ft2'), { value: 2, from: 'm2', to: 'ft2' });
});

test('rejects malformed input', () => {
  assert.throws(() => parse('10 km mi'), /Cannot parse/);
});

test('parseAll splits on semicolons', () => {
  assert.deepEqual(parseAll('10 km to mi; 2 hr to min'), [
    { value: 10, from: 'km', to: 'mi' },
    { value: 2, from: 'hr', to: 'min' },
  ]);
});
