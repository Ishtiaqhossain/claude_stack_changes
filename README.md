# Stack Changes

**One diff, one thesis** — a Claude Code skill that teaches coding agents to land changes like a
**senior engineer**: small, reviewable, **stacked**, **buildable**, **testable**, and
**refactor-first**.

> Not another AI PR *reviewer* (the web has plenty). This decomposes a large change into a stack
> of single-thesis PRs/diffs/CLs — the way review actually scales: review latency, CI cost,
> ownership boundaries, rollback, trunk-based development, and reviewer empathy.

The skill lives in **[`stack-changes/SKILL.md`](stack-changes/SKILL.md)**.

## In a nutshell

**Input**
> "Split this 1,000-line PR that adds CSV/JSON export, filtering, sorting, budgets, and CLI wiring."

**Output** — a refactor-first stack, each change buildable and testable on its own:

```
[1/8] refactor: introduce Money and Transaction model
[2/8] refactor: route rendering through a query pipeline
[3/8] refactor: extract a Formatter interface
[4/8] feat: add export formats (CSV / JSON / …)
[5/8] feat: add filtering
[6/8] feat: add sorting and grouping
[7/8] feat: add budgets
[8/8] feat: wire the CLI end-to-end
```

The three refactors land **first**, so each feature is a small diff. *(This is exactly the
[`demo/`](demo/) example, landed as PRs #11–#19.)*

## The skill

[`stack-changes/SKILL.md`](stack-changes/SKILL.md) takes a large
change and carves it into a stack of small, single-thesis units of review. Highlights:

- **One diff, one thesis.** A change is an argument with one topic sentence; the reviewer
  evaluates one claim. "Small" is a *communication* rule, and splitting is the *empathetic*
  option for the reviewer.
- **Refactor-first.** When a feature needs existing code reshaped, the reshaping ships *before*
  the feature — as its own changes — so the feature lands as a small, obvious diff.
- **Atomic commits ≠ atomic reviews.** The unit of review is the whole diff, so split the
  *reviewable unit* into a **stack** — a clean commit history inside one big PR isn't enough.
- **Tool-agnostic.** Neutral terms (a "change") with mappings for GitHub PRs, Sapling/
  Phabricator diffs, and Gerrit CLs — plus the native stacking workflow for each. A bundled
  [`detect-review-system.sh`](stack-changes/scripts/detect-review-system.sh)
  classifies the repo and routes to the right mechanics.
- **Built for scale.** Ownership-aligned splits, presubmit economics, feature-gating over long
  branches, right-sizing (don't over-split), and Google's small-CL / review-speed guidance.

## Stack it — copy-paste recipes

Once you have the [Split Plan](stack-changes/SKILL.md#the-split-plan-the-artifact-to-produce),
land it. Pick the recipe for your review system (run
[`detect-review-system.sh`](stack-changes/scripts/detect-review-system.sh) if unsure):

**GitHub + a stacking tool (Graphite):**
```sh
gt create -m "[1/4] refactor: extract formatter seam"
gt create -m "[2/4] refactor: introduce registry"
gt create -m "[3/4] feat: add CSV formatter"
gt submit        # opens/updates the whole stack of PRs
```

**Plain git + GitHub (no stacking tool):**
```sh
git switch -c stack/1-extract-seam main
gh pr create --base main --title "[1/4] refactor: extract formatter seam"

git switch -c stack/2-registry stack/1-extract-seam     # branch off the parent
gh pr create --base stack/1-extract-seam --title "[2/4] refactor: introduce registry (needs #1)"
```

**Local commits, no remote yet** — reshape in place, bind to PRs later:
```sh
git reset --mixed main      # uncommit a big local commit
git add <files for change 1> && git commit -m "[1/4] refactor: …"   # repeat per change
```

Sapling, Phabricator, and Gerrit recipes are in
[the skill](stack-changes/SKILL.md#stacking-in-your-review-system).

## The example: `demo/` — an expense-report tool

[`demo/`](demo/) starts (on `main`) as a naive, **text-only** expense report. The feature we
then land — **multi-format export (text/csv/json/html/markdown/table/summary) + filtering +
sorting + grouped subtotals + per-category budgets + a CLI** — is landed **two ways**:

| | How | What a reviewer faces |
|---|---|---|
| **Before** ❌ | [**#11** — one monolith PR](https://github.com/Ishtiaqhossain/claude_pr_skills/pull/11) | **1019 insertions** in a single diff that mixes three refactors (model, formatter seam, query pipeline) with five distinct features. One LGTM. |
| **After** ✅ | a **refactor-first stack of 8 PRs** — [#12–#19](https://github.com/Ishtiaqhossain/claude_pr_skills/pull/12) | each PR makes one argument, builds + tests on its own (43–355 lines), and the three refactors land **first** so each feature is a small diff |

```bash
cd demo
npm run build   # syntax-check + run the entry point
npm test        # node --test  (51 tests at the top of the stack)

node src/index.js --format markdown --group-by category   # try it
node src/index.js --budget --format summary
```

### The refactor-first stack

The first three changes are **pure refactors** — the base report test is **byte-for-byte
unchanged and green through all of them**, which is the proof they changed no behavior. Only
then do the features land, each a small diff against the prepared seams.

| PR | Thesis | Size | Kind |
|----|--------|------|------|
| [#12](https://github.com/Ishtiaqhossain/claude_pr_skills/pull/12) | typed `Money`/`Transaction` model | ~104 | refactor |
| [#13](https://github.com/Ishtiaqhossain/claude_pr_skills/pull/13) | route rendering through a query pipeline (identity) | ~49 | refactor |
| [#14](https://github.com/Ishtiaqhossain/claude_pr_skills/pull/14) | extract a `Formatter` interface + registry | ~79 | refactor |
| [#15](https://github.com/Ishtiaqhossain/claude_pr_skills/pull/15) | add csv/json/html/markdown/table/summary | ~355 | feature |
| [#16](https://github.com/Ishtiaqhossain/claude_pr_skills/pull/16) | filter by date / category / min amount | ~43 | feature |
| [#17](https://github.com/Ishtiaqhossain/claude_pr_skills/pull/17) | sorting + grouping with subtotals | ~139 | feature |
| [#18](https://github.com/Ishtiaqhossain/claude_pr_skills/pull/18) | per-category budgets | ~143 | feature |
| [#19](https://github.com/Ishtiaqhossain/claude_pr_skills/pull/19) | wire up the CLI + enable end-to-end | ~133 | feature |

> The monolith and the eight stacked PRs are on the repository's **Pull Requests** tab — open
> the monolith and try to review it, then walk the stack and feel the difference.

## Local break-up walkthrough

[`demo-split/instruction.md`](demo-split/instruction.md) is a second, self-contained example:
a 390-line multi-concern `unit-convert` change landed as **one local commit**, then carved into
a stack of six single-thesis commits by invoking the skill. It includes step-by-step
instructions to **run the demo yourself locally** and the **captured output** of invoking
`/stack-changes` (review-system detection, the seam map, the resulting stack, and per-commit
isolation tests). The large change to start from is in [`demo-split/unit-convert/`](demo-split/unit-convert/).

## Repository layout

```
stack-changes/SKILL.md     the skill
demo/                      the expense-report example (monolith vs 8-PR stack)
demo-split/                local break-up walkthrough (large commit -> 6-commit stack)
demo-split/instruction.md  how to run it + captured /stack-changes output
```
