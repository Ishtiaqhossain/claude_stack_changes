# Validation — turning claims from *asserted* to *observed*

The skill promises that a large change can be split into a stack where **each change builds and
tests on its own**. This file tracks the evidence for that promise across three layers, per the
expert review framework.

## Definition of done

| Item | Status | Evidence |
|------|--------|----------|
| Layer 1 — detector fixture matrix (incl. adversarial) passes in CI | ✅ | [`stack-changes/scripts/detect-review-system.test.sh`](../stack-changes/scripts/detect-review-system.test.sh) — 12 cases; CI job `detector`. |
| Layer 2 — decomposition reasoning proven on an *independent* corpus | ◑ **started** | Harness ([`eval/`](eval/)) + **2 independent, build-verified** splits on real external code: yocto-queue (easy) and **quick-lru (hard — a behavior-preserving refactor with tests unchanged, then a feature → exercises the refactor/behavior seam, the hardest to verify)**. Breadth (Go/Cargo/Gradle/Django, run 3×) still open. Rubric + corpus log below. |
| Layer 3 — per-revision build/test loop in the skill, demonstrated green on 2+ build systems | ✅ | Skill section "Verify the Stack"; [`scripts/verify-stack.sh`](scripts/verify-stack.sh); transcript below; CI job `verify-stack`. |
| README install commands work as written | ✅ | Clone URL → HTTP 200; repo name `claude_stack_changes`; demo PRs #11–#19 resolve. |
| Detector failure modes + no-script fallback documented | ✅ | `SKILL.md` → "Detecting Your Review System". |

## Layer 3 — observed buildability across build systems

`scripts/verify-stack.sh "<the project's own build+test cmd>" <ref>...` checks out each stack
node, runs the command, and reads the exit code — so it is portable across build systems.

**Python (`demo-py/`, build = `py_compile`, test = `unittest`):**
```
$ bash scripts/verify-stack.sh "cd demo-py && python3 -m py_compile *.py && python3 -m unittest" py-0 py-1 py-2 py-3
ok    py-0
ok    py-1      # refactor — test_report.py byte-unchanged vs py-0 (behavior preserved)
ok    py-2
ok    py-3
ALL GREEN (4 nodes)
```

**npm (`demo/`, build = `npm run build`, test = `npm test`):**
```
$ bash scripts/verify-stack.sh "cd demo && npm run build && npm test" expense-stack/1-model … 8-cli
ok    expense-stack/1-model      … through …
ok    expense-stack/8-cli
ALL GREEN (8 nodes)
```

Both are enforced in CI (job `verify-stack`) on every push, so a regression that breaks a node
fails the build instead of slipping through.

## Layer 2 — decomposition reasoning (the weakest link, stated honestly)

The split *reasoning* is LLM-driven, so trust needs **breadth** and **independence**. Current
evidence is weak: only **two** worked stacks (npm expense-report, Python report), and **both were
authored by the skill's author**. That tests whether the design is internally consistent — not
whether the reasoning generalizes to a stranger's repo. They risk *teaching to the test*. **Treat
Layer 2 as not yet proven.**

### Scoring rubric (per Split Plan)
| Criterion | How to check | Objective? |
|-----------|--------------|------------|
| Refactor/behavior cleanly separated | refactor nodes change no test files | yes (diff) |
| **Valid topological order** | no node uses a symbol introduced later — proven when the node **builds + tests in isolation** | **yes** (`verify-stack.sh`) |
| No over-splitting | each node's one-line motivation stands without citing a later node | judgment |
| "Test proof" is real | the named test exists and runs at that revision | yes |
| Review-system mechanics correct | detector label matches the repo; commands fit it | yes |

The load-bearing criterion is **topological validity**, and it is *objective*: `verify-stack.sh`
green at every node **is** the proof (a node referencing later code can't build alone). The two
existing stacks pass it — that part is observed. What's missing is **independence and breadth.**

### Corpus plan — to close the gap (status: OPEN)
Assemble **8–12 fat diffs the author did not build the skill around** — real changes pulled from
public repos spanning build systems (Node, Go/Cargo, Python/Django, Java/Gradle or Bazel). For each:
produce a Split Plan → run `verify-stack.sh` over it (objective topo check) → grade the rubric.
Run **3× per repo** and record a per-repo pass rate. *Stable-and-reasonable* is the bar;
*occasionally-wild* means the skill text needs tightening. This is an ongoing eval program, not a
one-shot — and it is the single biggest remaining gap between "works here" and "works on your repo."

### Corpus log (independent — not author-built)
| # | Repo | Bundled change → split | Build sys | Topo valid (objective) | Notes |
|---|------|------------------------|-----------|------------------------|-------|
| 1 | [`sindresorhus/yocto-queue`](https://github.com/sindresorhus/yocto-queue) | `.peek()` + `.drain()` → 2 nodes | npm / ava | ✅ `verify-stack` green (2/2) | Real external code. **Easy** — two independent features, trivial topology, no refactor. Rubric: topo ✅ · separation n/a · no-over-split ✅ · test-proof ✅ · mechanics ✅ (github→branch-per-PR). |
| 2 | [`sindresorhus/quick-lru`](https://github.com/sindresorhus/quick-lru) | add `.expiresIn()` → **refactor-first**: [1] extract `#getItem` seam, [2] add feature | npm / ava | ✅ `verify-stack` green (2/2) | Real external code. **Hard — exercises the refactor/behavior seam** (the most common one, and the hardest to verify). Node 1 is a genuine *behavior-preserving* refactor: `test.js` byte-unchanged vs base **and** ava green (71) — the proof. Node 2 adds the feature on the seam (ava 74). Rubric: topo ✅ · refactor/behavior separated ✅ (test diff = 0) · no-over-split ✅ · test-proof ✅ · mechanics ✅. |

Reproduce #1:
```sh
git clone https://github.com/sindresorhus/yocto-queue yq && cd yq && npm install
base=$(git rev-parse 5bf850c^)                       # before .peek()/.drain()
git checkout -B split "$base"
git cherry-pick --no-edit 5bf850c && git tag yq-1-peek   # [1/2] add .peek()
git cherry-pick --no-edit d631ea8 && git tag yq-2-drain  # [2/2] add .drain()
<this-repo>/eval/run-eval.sh "$PWD" "npx ava" yq-1-peek yq-2-drain
```

Reproduce #2 (quick-lru, the hard case):
```sh
git clone https://github.com/sindresorhus/quick-lru qlru && cd qlru && npm install
git checkout -B split "$(git rev-parse 6c0efa5^)"            # base, before .expiresIn()
# [1/2] refactor — extract `#getItem(key){ return #cache.get(key) ?? #oldCache.get(key) }`
#       and rewrite has() to use it (behavior-preserving). Commit, tag ql-1-refactor.
# [2/2] feat — add expiresIn() using #getItem + its tests. Commit, tag ql-2-feat.
<this-repo>/eval/run-eval.sh "$PWD" "npx ava" ql-1-refactor ql-2-feat
# proof the refactor preserved behavior: `git diff <base> -- test.js` is empty, ava green.
```

**Honest status:** **two independent, build-verified** splits now — one *easy* (yocto-queue, two
features) and one *hard* (quick-lru: a real behavior-preserving refactor with `test.js` unchanged,
then a feature). The hard case exercises the refactor/behavior seam — the most common one and the
hardest to verify (clean separation, behavior preserved) — on code the author didn't write. Still missing: **breadth** — Go/Cargo/Gradle/Django, run 3× each
with per-repo pass rates, which needs a CI matrix with those toolchains. That is the open work.
