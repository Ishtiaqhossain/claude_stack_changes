# Stack Changes

A Claude Code skill that breaks a large change into a **stack of small, single-thesis PRs**
(or diffs / CLs) — each buildable and testable on its own, with refactors first.

> **One diff, one thesis.** Land changes like a senior engineer.

[![CI](https://github.com/Ishtiaqhossain/claude_stack_changes/actions/workflows/ci.yml/badge.svg)](https://github.com/Ishtiaqhossain/claude_stack_changes/actions/workflows/ci.yml)

![Claude Code producing a Split Plan from a 1,000-line PR](assets/split-plan.v3.svg)

## What it does

Hand it a big, mixed change. It writes a plan and reshapes the work into an ordered stack where
**each change makes exactly one argument and stands on its own**.

**Input**
> "Split this 1,000-line PR that adds CSV/JSON export, filtering, sorting, budgets, and CLI wiring."

**Output** — a refactor-first stack (each step builds + tests by itself):

```
Before
  main ──● one PR: refactor + export + filters + sorting + budgets + CLI   (1,019 lines, one "LGTM")

After
  main
   └─ [1/8] refactor: typed model
       └─ [2/8] refactor: query pipeline
           └─ [3/8] refactor: formatter seam
               └─ [4/8] feat: export formats
                   └─ [5/8] feat: filtering
                       └─ [6/8] feat: sorting + grouping
                           └─ [7/8] feat: budgets
                               └─ [8/8] feat: wire the CLI end-to-end
```

The three refactors land **first**, so each feature is a small, obvious diff.

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

- **Before vs. after, as real PRs** — [`demo/`](demo/) (npm):
  [PR&nbsp;#11](https://github.com/Ishtiaqhossain/claude_stack_changes/pull/11) is a 1,019-line
  monolith; [#12–#19](https://github.com/Ishtiaqhossain/claude_stack_changes/pull/12) is the
  refactor-first stack, each PR green on its own. Open #11, try to review it, then walk the stack
  (`cd demo && npm test`).
- **Break up a local commit, step by step** — [`demo-split/instruction.md`](demo-split/instruction.md):
  a 390-line commit carved into six single-thesis commits, with steps to reproduce it + the captured
  skill output.
- **A second build system** — [`demo-py/`](demo-py/) (Python): the same refactor-first split in a
  non-npm project, so the approach isn't tied to one ecosystem.

**Verified, not asserted.** Every node of every demo stack is checked out and built + tested *on
its own* — enforced in CI across both build systems via
[`scripts/verify-stack.sh`](scripts/verify-stack.sh) (it runs the project's own command and reads
the exit code, so it's build-system-agnostic). The split reasoning is also tested on **independent
external repos the author didn't build** — `yocto-queue`, and `quick-lru` for a real *refactor-first*
split (a behavior-preserving refactor with tests unchanged, then the feature) — each node
build-verified in CI. The review-system detector is proven on a **12-case fixture matrix**,
including adversarial cases — e.g. a GitHub repo carrying a stray Gerrit `Change-Id` must not be
misread as Gerrit. Full **[validation methodology](VALIDATION.md)**: the
"asserted → observed" framework, the evidence, and the checklist.

## What this is not

**This is not an AI PR reviewer.** It doesn't hunt for bugs or post review comments. It helps the
**author** construct better *review units* — small, ordered, refactor-first changes — *before* a
human (or another tool) reviews them.

## Repository layout

```
stack-changes/        the skill — SKILL.md + a review-system detector (fixture-tested)
demo/                 before/after example, npm: monolith (PR #11) vs stack (#12–#19)
demo-split/           local break-up walkthrough + the large sample change
demo-py/              second build system: the same split in a Python project (tags py-0…py-3)
scripts/verify-stack.sh   checks out each stack node and builds + tests it
VALIDATION.md         what's proven (detector matrix, per-node green on npm + Python) and how
```
