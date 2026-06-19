# Stack Changes

A Claude Code skill that breaks a large change into a **stack of small, single-thesis PRs**
(or diffs / CLs) — each buildable and testable on its own, with refactors first.

> **One diff, one thesis.** Land changes like a senior engineer.

> 🧭 **New here or feeling lost?** [`MAP.md`](MAP.md) explains every folder in one line — the
> short version: to use the skill you only need `stack-changes/`; everything else just proves it works.

## What it does

Hand it a big, mixed change. It writes a plan and reshapes the work into an ordered stack where
**each change makes exactly one argument and stands on its own**.

**Input**
> "Split this 1,000-line PR that adds CSV/JSON export, filtering, sorting, budgets, and CLI wiring."

**Output** — a refactor-first stack (each step builds + tests by itself):

<!-- BEGIN:flagship-demo (generated from the expense-report branches by validation/scripts/gen-readme.mjs — do not edit by hand) -->
```
Before — one change
  main ──●  the whole feature in a single diff: +1,019 lines across 27 files, one "LGTM"

After — a refactor-first stack (refactors first; each builds + tests on its own, lands bottom-up):
   [1/8] refactor: introduce a Money/Transaction domain model
   [2/8] refactor: route rendering through a query pipeline
   [3/8] refactor: extract a Formatter interface + registry
   [4/8] feat: add csv, json, html, markdown, table, and summary formatters
   [5/8] feat: add filtering by date range, category, and minimum amount
   [6/8] feat: add sorting and grouping by category with subtotals
   [7/8] feat: add per-category budgets
   [8/8] feat: wire up the CLI and enable the full feature end to end
```
<!-- END:flagship-demo -->

The three refactors land **first**, so each feature is a small, obvious diff.

Refactor-first is the seam this example happens to use — and the most common one — but it's not the
whole skill. The guiding principle is **one diff, one thesis**; the skill finds whatever natural
seam separates the theses (independent features, distinct behavior changes, ownership boundaries,
risky-vs-safe), and refactor-first is just the highest-leverage of them.

**A different change, a different seam.** When nothing needs reshaping, there's no refactor to land
first — the skill splits along another seam. Take a real one from the corpus
([`sindresorhus/yocto-queue`](https://github.com/sindresorhus/yocto-queue)): one commit bundling two
new queue methods.

**Input**
> "Split this commit that adds both `.peek()` and `.drain()`."

**Output** — split on the *independent-behavior* seam (no refactor; each is its own thesis):

```
Before
  main ──● one commit: add .peek() + .drain()

After
  main
   ├─ [1/2] feat: add .peek()    (independent — base on trunk)
   └─ [2/2] feat: add .drain()   (independent — base on trunk)
```

Neither depends on the other, so they can be reviewed in parallel — and every node still builds and
tests on its own ([`validation/eval/`](validation/eval/) verifies exactly this).

## Quick start

**Install** — personal Claude Code skills live in `~/.claude/skills/{skill-name}/SKILL.md`:

```bash
git clone https://github.com/Ishtiaqhossain/claude_stack_changes.git
mkdir -p ~/.claude/skills
cp -r claude_stack_changes/stack-changes ~/.claude/skills/stack-changes
```

**Use** — open Claude Code in a git repo and run:

```
/stack-changes create a Split Plan for my current uncommitted diff
/stack-changes split my last commit into single-thesis commits
/stack-changes split PR #123 into a stack of reviewable PRs
```

## Who this is for

**Use it when:**
- A reviewer said your PR is "too big."
- You're about to make a risky change and want a safe, staged landing plan.
- Your change mixes refactoring, feature work, tests, and CLI/UI wiring.
- You work in a monorepo or across multiple code owners.
- You want help splitting work *before* it goes to review.

**Skip it when:**
- The change is already small and atomic.
- You just want a generic code review or bug hunt.
- It's a mechanical, repo-wide codemod (that's a different playbook).

## See it in action

- **Before vs. after, as real PRs** — [`validation/demo/`](validation/demo/) (npm):
  <!-- BEGIN:flagship-prs (updated by validation/scripts/regen-demo.sh finish — do not edit by hand) -->
  [PR&nbsp;#11](https://github.com/Ishtiaqhossain/claude_stack_changes/pull/11) is the monolith (the whole feature in one diff — sized in the diagram above); [#20–#27](https://github.com/Ishtiaqhossain/claude_stack_changes/pull/20) is the refactor-first stack.
  <!-- END:flagship-prs -->
  Each PR is green on its own — open the monolith, try to review it, then walk the stack
  (`cd validation/demo && npm test`).
- **Break up a local commit, step by step** — [`validation/demo-split/instruction.md`](validation/demo-split/instruction.md):
  a 390-line commit carved into six single-thesis commits, with steps to reproduce it + the captured
  skill output.
- **A second build system** — [`validation/demo-py/`](validation/demo-py/) (Python): the same refactor-first split in a
  non-npm project, so the approach isn't tied to one ecosystem.

**Verified, not asserted.** Every node of every demo stack is checked out and built + tested *on
its own* — enforced in CI across both build systems via
[`validation/scripts/verify-stack.sh`](validation/scripts/verify-stack.sh) (it runs the project's own command and reads
the exit code, so it's build-system-agnostic). The split reasoning is also tested on **independent
external repos the author didn't build** — `yocto-queue`, and `quick-lru` for a real *refactor-first*
split (a behavior-preserving refactor with tests unchanged, then the feature) — each node
build-verified in CI. The review-system detector is proven on a **12-case fixture matrix**,
including adversarial cases — e.g. a GitHub repo carrying a stray Gerrit `Change-Id` must not be
misread as Gerrit. Full **[validation methodology](validation/VALIDATION.md)**: the
"asserted → observed" framework, the evidence, and the checklist.

## What this is not

**This is not an AI PR reviewer.** It doesn't hunt for bugs or post review comments. It helps the
**author** construct better *review units* — small, ordered, refactor-first changes — *before* a
human (or another tool) reviews them.

## Repository layout

```
stack-changes/        THE SKILL — SKILL.md + a review-system detector (fixture-tested). Install this.
validation/           proves the skill works (not needed to use it):
  demo/                 before/after example, npm: monolith (PR #11) vs stack (#12–#19)
  demo-split/           local break-up walkthrough + the large sample change
  demo-py/              second build system: the same split in a Python project (tags py-0…py-3)
  eval/                 grades splits of real outside repos (yocto-queue, quick-lru)
  scripts/verify-stack.sh   checks out each stack node and builds + tests it
  VALIDATION.md         what's proven (detector matrix, per-node green) and how
MAP.md                one-line tour of every folder — start here if it feels like a lot
```
