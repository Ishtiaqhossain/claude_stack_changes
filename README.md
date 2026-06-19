# Stack Changes

A Claude Code skill that breaks a large change into a **stack of small, single-thesis PRs**
(or diffs / CLs) — each buildable and testable on its own, with refactors first.

> **One diff, one thesis.** Land changes like a senior engineer.

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

## Quick start

**Install** — personal Claude Code skills live in `~/.claude/skills/<name>/SKILL.md`:

```bash
git clone https://github.com/Ishtiaqhossain/claude_split_changes.git
mkdir -p ~/.claude/skills
cp -r claude_split_changes/stack-changes ~/.claude/skills/stack-changes
```

**Use** — open Claude Code in a git repo and run:

```
/stack-changes create a Split Plan for my current uncommitted diff
/stack-changes split my last commit into single-thesis commits
/stack-changes split PR #123 into a stack of reviewable PRs
```

**Expected output** — it starts with a **Split Plan** you approve *before* any git happens:

```
## Split Plan
### Final goal
<one sentence: what the whole change accomplishes>
### Concerns currently mixed together
1. <concern> — refactor   2. <concern> — behavior   …
### Proposed stack
| # | Title | Type | Depends on | Files | Test proof | Risk |
### Parallelizable changes
<which changes are independent vs strictly stacked>
### Land order
bottom-up: #1 → #2 → …
### PR/diff/CL description template
<per-change stack list + base + "depends on">
```

Then it lands the stack with the right commands for your review system (GitHub, Sapling, Gerrit,
or local commits with no remote yet). Full method, per-tool recipes, and the plan template are in
**[`stack-changes/SKILL.md`](stack-changes/SKILL.md)**.

## See it in action

- **Before vs. after, as real PRs** — [`demo/`](demo/):
  [PR&nbsp;#11](https://github.com/Ishtiaqhossain/claude_split_changes/pull/11) is a 1,019-line
  monolith; [#12–#19](https://github.com/Ishtiaqhossain/claude_split_changes/pull/12) is the
  refactor-first stack, each PR green on its own. Open #11, try to review it, then walk the stack.
  ```sh
  cd demo && npm test     # the demos are Node projects (Node 18+)
  ```
- **Break up a local commit, step by step** — [`demo-split/instruction.md`](demo-split/instruction.md):
  a 390-line commit carved into six single-thesis commits, with steps to reproduce it yourself and
  the captured output of running the skill.

## What this is not

**This is not an AI PR reviewer.** It doesn't hunt for bugs or post review comments. It helps the
**author** construct better *review units* — small, ordered, refactor-first changes — *before* a
human (or another tool) reviews them.

## Repository layout

```
stack-changes/   the skill — SKILL.md + a review-system detector
demo/            before/after example: monolith (PR #11) vs stack (#12–#19)
demo-split/      local break-up walkthrough + the large sample change
```
