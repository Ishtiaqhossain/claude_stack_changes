# Demo: breaking up a large commit with `stack-changes`

A worked demonstration of the [`stack-changes`](../stack-changes/SKILL.md) skill applied to a
real, large, multi-concern **local commit** — carving it into a stack of small, single-thesis
commits that each build and test on their own.

The large change lives in [`unit-convert/`](unit-convert/): a 7-dimension unit-conversion CLI
(units table + convert + format + parse + typo-suggest + list + CLI) — **390 lines across 14
files**, deliberately authored as one commit.

---

## Run it yourself locally

You need Node 18+ and the skill installed at `~/.claude/skills/stack-changes/`
(`cp -r stack-changes ~/.claude/skills/`).

```bash
# 1. Start a branch and land the large change as ONE big commit.
git switch -c big-change/unit-convert main
git add demo-split/unit-convert
git commit -m "Add unit-convert CLI (one large, multi-concern commit)"

# 2. Confirm it builds + tests as a whole.
( cd demo-split/unit-convert && npm run build && npm test )   # ~35 tests pass

# 3. In Claude Code, invoke the skill against that commit:
#
#       /stack-changes break up the unit-convert commit on this branch
#
# The skill detects your review system, finds the natural seams, and reshapes the
# single commit into a stack of single-thesis commits via `git reset` + re-commit —
# each commit green on its own. (Captured output below.)
```

> The recorded run had the project at the repo root as `unit-convert/`; here it lives under
> `demo-split/unit-convert/`, so paths in your run will be prefixed accordingly.

---

## Captured output — invoking `/stack-changes`

### 1. Detect the review system
```
$ bash stack-changes/scripts/detect-review-system.sh
github-plain        # branch-per-PR — but the commit is local & unpushed,
                    # so reshape it into a local commit stack now; bind to PRs at push.
```

### 2. Map the end state (import graph → natural seams)
```
units.js, format.js, parse.js   ->  (no local deps)      ← foundations / independent
convert.js, list.js, suggest.js ->  units                ← depend on the units table
index.js                        ->  parse, convert, format, suggest, list   ← the integrator
```
No **refactor-first** here: this is greenfield (nothing existing to reshape), so the split is a
**dependency-ordered feature stack** — foundations at the bottom, the integrating CLI on top.

### 3. Decomposition (6 single-thesis changes)
| # | Thesis | Files | Deps |
|---|--------|-------|------|
| 1 | unit conversion core (units table + dimension-checked convert) | `units`, `convert`, +test, `package.json` | — |
| 2 | result formatting (precision / significant figures) | `format`, +test | — (independent) |
| 3 | expression parsing (single + batch) | `parse`, +test | — (independent) |
| 4 | nearest-unit typo suggestions | `suggest`, +test | units |
| 5 | list units by dimension | `list`, +test* | units |
| 6 | command-line interface (flags, batch, friendly errors) | `index`, +cli test, `README` | all |

\* `list.js` had no standalone test (only exercised via the CLI), so the skill **added**
`test/list.test.js` so change 5 isn't a test-less fragment.

### 4. Reshape: uncommit the big commit, re-commit in pieces
```bash
git tag uc-mono HEAD            # keep a reference to the original
git reset --mixed main         # uncommit; files become unstaged

git add package.json src/units.js src/convert.js test/convert.test.js
git commit -m "[1/6] feat: unit conversion core (units table + dimension-checked convert)"
git add src/format.js test/format.test.js
git commit -m "[2/6] feat: result formatting (precision / significant figures)"
git add src/parse.js test/parse.test.js
git commit -m "[3/6] feat: expression parsing (single + batch)"
git add src/suggest.js test/suggest.test.js
git commit -m "[4/6] feat: nearest-unit typo suggestions"
git add src/list.js test/list.test.js
git commit -m "[5/6] feat: list units by dimension"
git add src/index.js test/cli.test.js README.md
git commit -m "[6/6] feat: command-line interface (flags, batch, friendly errors)"
```

### 5. Result — a stack of 6 single-thesis commits
```
main
└ [1/6] unit conversion core      116 lines
  └ [2/6] result formatting         36 lines
    └ [3/6] expression parsing      49 lines
      └ [4/6] typo suggestions      47 lines
        └ [5/6] list by dimension   32 lines
          └ [6/6] command-line interface  129 lines
```

### 6. Verify each commit builds + tests in isolation
Each commit was checked out clean and run with `npm test`; test counts climb as each change adds
only its own coverage:

| Commit | Tests (pass/fail) | Build |
|--------|-------------------|-------|
| [1/6] core | 15 / 0 | ok |
| [2/6] format | 20 / 0 | ok |
| [3/6] parse | 26 / 0 | ok |
| [4/6] suggest | 29 / 0 | ok |
| [5/6] list | 31 / 0 | ok |
| [6/6] cli | 37 / 0 | ok |

End state is identical to the original big commit (`uc-mono`) **plus** the one added
`list.test.js`. On `github-plain`, each commit becomes a stacked branch + PR when pushed.
