# Stack Changes

A Claude Code skill that breaks a large change into a **stack of small, single-thesis PRs**
(or diffs / CLs) — each buildable and testable on its own, with refactors first.

> **One diff, one thesis.** Land changes like a senior engineer: small, reviewable, stacked,
> refactor-first.

## What it does

Hand it a big, mixed change. It proposes a plan and reshapes the work into an ordered stack
where **each change makes exactly one argument and stands on its own**.

**Input**
> "Split this 1,000-line PR that adds CSV/JSON export, filtering, sorting, budgets, and CLI wiring."

**Output** — a refactor-first stack (each change builds + tests by itself):

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

The three refactors land **first**, so each feature is a small, obvious diff.

## Install

Personal Claude Code skills live in `~/.claude/skills/<name>/SKILL.md`. Drop this one in:

```sh
git clone https://github.com/Ishtiaqhossain/claude_pr_skills.git
mkdir -p ~/.claude/skills
cp -r claude_pr_skills/stack-changes ~/.claude/skills/stack-changes
```

No dependencies — the skill is just `SKILL.md` plus a review-system detector (uses `git`/`bash`).

## Use it

In Claude Code, invoke it by name — or just ask in plain language:

```
/stack-changes split this large PR into a stack
/stack-changes break up my last local commit into single-thesis commits
/stack-changes create a Split Plan before I touch git
```

It detects your review system (GitHub, Sapling, Gerrit, or local commits with no remote yet),
proposes the split, and lands the stack with the right commands for that system. The full
method, per-tool stacking recipes, and the Split Plan template are in
**[`stack-changes/SKILL.md`](stack-changes/SKILL.md)**.

## See it in action

- **Before vs. after, as real PRs** — [`demo/`](demo/). The same change landed two ways:
  [PR&nbsp;#11](https://github.com/Ishtiaqhossain/claude_pr_skills/pull/11) is a 1,019-line
  monolith; [#12–#19](https://github.com/Ishtiaqhossain/claude_pr_skills/pull/12) is the
  refactor-first stack, each PR green on its own. Open #11, try to review it, then walk the
  stack and feel the difference.
  ```sh
  cd demo && npm test     # the demos are Node projects (Node 18+)
  ```

- **Break up a local commit, step by step** — [`demo-split/instruction.md`](demo-split/instruction.md):
  a 390-line commit carved into six single-thesis commits, with instructions to reproduce it
  yourself and the captured output of running the skill.

## Repository layout

```
stack-changes/   the skill — SKILL.md + a review-system detector
demo/            before/after example: monolith (PR #11) vs stack (#12–#19)
demo-split/      local break-up walkthrough + the large sample change
```
