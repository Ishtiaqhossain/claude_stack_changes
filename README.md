# claude_pr_skills

A Claude Code skill — **[`split-changes`](split-changes/SKILL.md)** —
plus a worked, **buildable** example of it.

> **One diff, one thesis.** Each change should make exactly one argument — and that argument
> should be buildable and testable by itself.

## The skill

[`split-changes/SKILL.md`](split-changes/SKILL.md) takes a large
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
  [`detect-review-system.sh`](split-changes/scripts/detect-review-system.sh)
  classifies the repo and routes to the right mechanics.
- **Built for scale.** Ownership-aligned splits, presubmit economics, feature-gating over long
  branches, right-sizing (don't over-split), and Google's small-CL / review-speed guidance.

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
`/split-changes` (review-system detection, the seam map, the resulting stack, and per-commit
isolation tests). The large change to start from is in [`demo-split/unit-convert/`](demo-split/unit-convert/).

## Repository layout

```
split-changes/SKILL.md     the skill
demo/                      the expense-report example (monolith vs 8-PR stack)
demo-split/                local break-up walkthrough (large commit -> 6-commit stack)
demo-split/instruction.md  how to run it + captured /split-changes output
```
