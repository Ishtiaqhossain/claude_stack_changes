import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { run, runAll } from '../src/index.js';

const cli = (args) =>
  execFileSync('node', ['src/index.js', ...args.split(' ')], { encoding: 'utf8' }).trim();

test('run() converts a single expression', () => {
  assert.equal(run('100 C to F'), '212 F');
});

test('runAll() converts several expressions', () => {
  assert.equal(runAll('10 km to mi; 2 hr to min'), '6.2137 mi\n120 min');
});

test('CLI prints a conversion', () => {
  assert.equal(cli('10 km to mi'), '6.2137 mi');
});

test('CLI --precision controls decimals', () => {
  assert.equal(cli('10 km to mi --precision 2'), '6.21 mi');
});

test('CLI --list shows units grouped by dimension', () => {
  const out = cli('--list');
  assert.match(out, /^area: /m);
  assert.match(out, /temperature: .*C.*F.*K|temperature: .*K.*C.*F/);
});

test('CLI suggests a unit on a typo', () => {
  // execFileSync throws on non-zero exit; the suggestion is on stderr.
  try {
    cli('1 kg to lbs');
    assert.fail('expected non-zero exit');
  } catch (err) {
    assert.match(String(err.stderr), /Unknown unit: lbs \(did you mean "lb"\?\)/);
  }
});
