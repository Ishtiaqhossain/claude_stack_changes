import { test } from 'node:test';
import assert from 'node:assert/strict';
import { convert } from '../src/convert.js';

const close = (a, b, eps = 1e-6) => Math.abs(a - b) < eps;

test('length: 10 km to mi', () => assert.ok(close(convert(10, 'km', 'mi'), 6.21371192)));
test('length: 1 ft to in', () => assert.ok(close(convert(1, 'ft', 'in'), 12)));
test('length: 1 yd to ft', () => assert.ok(close(convert(1, 'yd', 'ft'), 3)));
test('mass: 1 kg to lb', () => assert.ok(close(convert(1, 'kg', 'lb'), 2.20462262)));
test('time: 2 hr to min', () => assert.ok(close(convert(2, 'hr', 'min'), 120)));
test('data: 1 GB to MB', () => assert.ok(close(convert(1, 'GB', 'MB'), 1000)));
test('area: 1 ha to m2', () => assert.ok(close(convert(1, 'ha', 'm2'), 10000)));
test('volume: 1 m3 to L', () => assert.ok(close(convert(1, 'm3', 'L'), 1000)));

test('temperature: 100 C to F (boiling)', () => assert.ok(close(convert(100, 'C', 'F'), 212)));
test('temperature: 0 C to F (freezing)', () => assert.ok(close(convert(0, 'C', 'F'), 32)));
test('temperature: 98.6 F to C', () => assert.ok(close(convert(98.6, 'F', 'C'), 37)));
test('temperature: 0 C to K', () => assert.ok(close(convert(0, 'C', 'K'), 273.15)));
test('temperature: -40 C to F (the crossover)', () => assert.ok(close(convert(-40, 'C', 'F'), -40)));

test('rejects cross-dimension conversion', () =>
  assert.throws(() => convert(1, 'km', 'kg'), /Cannot convert/));
test('rejects an unknown unit', () =>
  assert.throws(() => convert(1, 'km', 'parsec'), /Unknown unit/));
