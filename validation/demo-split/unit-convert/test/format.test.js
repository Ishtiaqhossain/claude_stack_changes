import { test } from 'node:test';
import assert from 'node:assert/strict';
import { format } from '../src/format.js';

test('rounds to 4 decimals and trims trailing zeros', () => {
  assert.equal(format(6.213711, 'mi'), '6.2137 mi');
});

test('an integer result has no decimal point', () => {
  assert.equal(format(212, 'F'), '212 F');
});

test('trims a bare trailing dot', () => {
  assert.equal(format(10.0, 'm'), '10 m');
});

test('honors a custom precision', () => {
  assert.equal(format(3.14159, 'm', { precision: 2 }), '3.14 m');
});

test('supports significant figures', () => {
  assert.equal(format(123.456, 'g', { sigfigs: 4 }), '123.5 g');
});
