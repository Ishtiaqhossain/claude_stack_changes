import { test } from 'node:test';
import assert from 'node:assert/strict';
import { suggest } from '../src/suggest.js';

test('suggests the nearest unit for a typo', () => {
  assert.equal(suggest('kgs'), 'kg');
});

test('suggests for a trailing-letter slip', () => {
  assert.equal(suggest('hrs'), 'hr');
});

test('returns null when nothing is close', () => {
  assert.equal(suggest('parsec'), null);
});
