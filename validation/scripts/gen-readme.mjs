#!/usr/bin/env node
// gen-readme.mjs — regenerate the README's flagship-demo block from the actual
// expense-report git refs, so it can never drift from the demo.
//
//   Source of truth: the `monolith/expense-report` branch (the "before") and the
//   `expense-stack/*` branches (the refactor-first "after").
//   Run after changing the demo:  node validation/scripts/gen-readme.mjs
//   CI runs it and fails if README.md changed (the `readme-fresh` job).
//
// Resolves refs locally (refs/heads/…) or, in CI, from origin/… — so it works
// both on a dev machine and on a fresh checkout that only fetched remotes.
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const git = (args) => execSync(`git ${args}`, { cwd: root, encoding: 'utf8' }).trim();
const has = (r) => { try { git(`rev-parse --verify -q "${r}"`); return true; } catch { return false; } };
const ref = (r) => (has(r) ? r : `origin/${r}`); // prefer local branch, fall back to origin/

const main = ref('main');
const monolith = ref('monolith/expense-report');

// "Before": size of the monolith diff (additions + files touched)
const numstat = git(`diff --numstat "${main}...${monolith}"`).split('\n').filter(Boolean);
const adds = numstat.reduce((s, l) => s + (parseInt(l.split('\t')[0], 10) || 0), 0);
const files = numstat.length;
const grouped = adds.toLocaleString('en-US'); // 1019 -> "1,019"

// "After": the refactor-first stack, one line per expense-stack/* branch (in order)
let branches = git(`for-each-ref --format="%(refname:short)" --sort=refname "refs/heads/expense-stack/*"`)
  .split('\n').filter(Boolean);
if (!branches.length) {
  branches = git(`for-each-ref --format="%(refname:short)" --sort=refname "refs/remotes/origin/expense-stack/*"`)
    .split('\n').filter(Boolean);
}
if (!branches.length) { console.error('no expense-stack/* branches found'); process.exit(2); }
const n = branches.length;
const stack = branches
  .map((b, i) => `   [${i + 1}/${n}] ${git(`log -1 --format="%s" "${b}"`)}`)
  .join('\n');

const block = [
  '```',
  'Before — one change',
  `  main ──●  the whole feature in a single diff: +${grouped} lines across ${files} files, one "LGTM"`,
  '',
  'After — a refactor-first stack (refactors first; each builds + tests on its own, lands bottom-up):',
  stack,
  '```',
].join('\n');

const BEGIN = '<!-- BEGIN:flagship-demo (generated from the expense-report branches by validation/scripts/gen-readme.mjs — do not edit by hand) -->';
const END = '<!-- END:flagship-demo -->';

const path = join(root, 'README.md');
const text = readFileSync(path, 'utf8');
const re = /<!-- BEGIN:flagship-demo[\s\S]*?-->\n[\s\S]*?\n<!-- END:flagship-demo -->/;
if (!re.test(text)) { console.error('flagship-demo markers not found in README.md'); process.exit(2); }
writeFileSync(path, text.replace(re, `${BEGIN}\n${block}\n${END}`));
console.error(`flagship-demo block regenerated: +${grouped} lines, ${files} files, ${n}-change stack`);
