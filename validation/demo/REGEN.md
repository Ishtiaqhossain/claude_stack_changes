# Regenerating this demo stack

This folder is the skill's **flagship example**: a 1,019-line monolith ([PR #11](https://github.com/Ishtiaqhossain/claude_stack_changes/pull/11),
branch `monolith/expense-report`) split into a **refactor-first stack** of small PRs
(`expense-stack/*`). "Regen" re-runs the skill on that monolith to rebuild the stack — do it
whenever you change `stack-changes/SKILL.md` and want the demo to reflect the skill's current
behavior. The README updates itself from the result.

## What it does

It's **semi-automated**: a script handles the mechanical, destructive parts; **you** run the skill
in the middle, so you approve the Split Plan (as `stack-changes` is designed to require). Three steps:

1. **`teardown`** — closes the old stack PRs and deletes the `expense-stack/*` branches. Records
   their commit SHAs so step 3 can tell a genuine re-run from a clone.
2. **You run the skill** on the monolith — it *genuinely decomposes* the change into fresh commits
   and opens one PR per node. This is **not** a script step: an agent does the decomposition, and the
   output is non-deterministic (the stack's shape and PR numbers can differ each time).
3. **`finish`** — verifies every new node builds + tests in isolation, enforces the non-skip guard,
   refreshes the README, and stages it for your review.

The monolith (PR #11 / `monolith/expense-report`) is the fixed **input** — it is never torn down.

## Prerequisites

- Run from the **repo root**, on a clean, up-to-date `main`.
- `gh` authenticated (the script opens/closes PRs) and `node` + `git` available.

## Run it

```sh
# 1 — discard the old stack (dry-run first; --yes actually closes PRs + deletes branches)
validation/scripts/regen-demo.sh teardown
validation/scripts/regen-demo.sh teardown --yes

# 2 — in Claude Code, run the skill on the monolith (you confirm its Split Plan):
#     /stack-changes split the monolith/expense-report change into a refactor-first stack;
#       name branches expense-stack/<n>-<slug> and open one PR per change

# 3 — verify the new stack and refresh the README
validation/scripts/regen-demo.sh finish
git diff --staged README.md          # review
git commit -m "demo: regenerate flagship stack" && git push
```

## The non-skip guard

`finish` **refuses to publish or touch the README if any node reuses a pre-teardown commit** —
i.e. the old stack re-pushed under new PR numbers instead of genuinely re-decomposed. On a real run
it prints `non-skip guard: every node is a fresh commit ✅`; otherwise it prints `BLOCKED …` and
exits. So the demo can't drift into a fake regeneration.

It also **won't update the README if any node is red** — a broken split can't reach the docs.

## What updates automatically

`finish` runs [`validation/scripts/gen-readme.mjs`](../scripts/gen-readme.mjs) `--prs`, which rewrites
two marked regions of the top-level `README.md` from the live branches:

- **`flagship-demo`** — the "Before / After" block (monolith size + the stack's titles).
- **`flagship-prs`** — the "see it in action" PR links (the new PR numbers).

The CI `readme-fresh` job regenerates the `flagship-demo` block on every push and fails if it's
stale, so the block can never silently drift from the demo. (PR numbers only change on a regen, so
they're refreshed by `finish`, not by CI.)

## Note on churn

Each regen retires the previous PRs (closed PRs keep their old numbers) and opens new ones, so the
public PR links rotate every time. That's inherent to re-running an LLM. If you'd rather not churn
the numbers on every skill tweak, only regen at deliberate "demo refresh" points.
