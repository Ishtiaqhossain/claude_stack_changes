---
name: splitting-changes-into-prs
description: Splits a large change into small, single-purpose units of review — PRs, diffs, or CLs — that are each buildable and testable on their own. Use when a change is too big to review, when a feature builds on existing code, when working in a large monorepo with stacked diffs, or when you need to land dependent changes and make the ordering clear. Triggers on "split this PR/diff/CL", "break up this change", "stack these".
---

# Splitting Changes Into PRs

## Overview

**Each change should do exactly one thing, and should be buildable and testable by itself.**

A large change is hard to review well — reviewers skim it, approve it, and miss bugs. A
sequence of small, single-purpose changes is the opposite: each one is easy to reason about,
reverts cleanly, bisects precisely, and gets *real* review instead of a reflexive LGTM.

At the scale of a large engineering org this stops being a nicety and becomes load-bearing.
With thousands of engineers committing to a shared trunk, small single-purpose changes are
what keep **review latency** low, **presubmit/CI cost** bounded, **rollback** surgical, and
**bisection** tractable across an enormous history. Both Meta and Google run effectively one
monorepo each, lean heavily on **stacked changes**, and treat *small* as a cultural default,
not an afterthought.

This skill is about decomposition: given a change that already exists (or is fully designed),
how do you carve it into a stack where every change stands on its own and the ordering is
obvious to a reviewer. The single most important move is **refactor-first** — when a feature
needs existing code reshaped, the reshaping ships *before* the feature, as its own changes, so
the feature itself lands as a small, obvious diff.

## A Note on Terminology

The unit of review has different names in different systems. This skill says **"change."**

| This skill | GitHub | Phabricator / Sapling | Critique (Google) | Gerrit |
|---|---|---|---|---|
| a **change** | Pull Request (PR) | Diff (`Dxxxxx`) | Changelist (CL) | Change |
| a **stack** | stacked PRs | diff stack | dependent CLs | relation chain |
| **land** it | merge | land | submit | submit |

Everything below applies in any of these. Where mechanics differ, see
[Stacking in your review system](#stacking-in-your-review-system).

## When to Use

- A change is over ~400 lines, or touches many files for more than one reason
- A new feature requires changing or reshaping existing code first
- A change mixes concerns: refactor + feature, behavior change + formatting, two features
- You need to land dependent (stacked) changes and want the dependency to be unambiguous
- A monorepo change spans multiple ownership boundaries (OWNERS / CODEOWNERS)
- A change would make presubmit build/test a huge set of targets
- Anything that makes a reviewer say "this is a lot — where do I start?"

**When NOT to use:** A genuinely atomic, single-purpose change. Don't split a 30-line bug
fix into a three-change stack — that's review theater. The goal is *one thing per change*,
not *minimum lines per change*.

## The One-Thing Rule

A change does "one thing" when it passes three acceptance tests:

- **Buildable alone** — checked out on its own, the revision compiles. No references to code
  that only exists in a sibling change.
- **Testable alone** — the change ships the tests for its own behavior, and the suite is green
  at that change's revision.
- **Presubmit-green alone** — it passes CI / presubmit independently, at its own position in
  the stack — not only when combined with the changes above it.

> **Litmus test:** Can you write the title without the word "and"? If the honest title is
> "Add caching **and** refactor the client", that's two changes.

A change that builds but has no way to prove it works is not done — "buildable and testable by
itself" is one requirement, not two optional ones.

## The Decomposition Process

```
1. Map the end state          →  what does the final diff actually touch?
2. Separate refactor/behavior →  pure refactors first, behavior changes after
3. Order by dependency        →  topological sort: what must land before what
4. Size & scope each change   →  ~200–400 lines; one owner set; small blast radius
```

### 1. Map the end state

List every file the finished change touches and *why* each is touched. Group the "whys" —
each distinct why is a candidate change.

### 2. Separate refactors from behavior changes (the load-bearing step)

A **pure refactor** changes structure but not behavior: existing tests pass *unchanged*. A
**behavior change** adds or alters what the code does: it comes with new or modified tests.

Never mix them in one change. A reviewer reading a mixed change can't tell which diff lines are
"safe restructuring" and which lines actually change what the system does — so they have to
treat all of it as risky. Split, and each half becomes easy:

- The refactor change: "tests are identical and still green → behavior is preserved."
- The feature change: a small diff against already-prepared code → the new behavior is the whole story.

### 3. Order by dependency

Sort the candidate changes so each one only depends on changes before it. Refactors that
prepare the ground come first; the feature that uses them comes last.

### 4. Size & scope each change

Target ~200–400 lines of meaningful diff. Two scale-aware criteria sharpen the split:

- **Split along ownership boundaries.** Carve changes so each one touches a coherent
  OWNERS / CODEOWNERS set. A change needing six teams' approval blocks on the slowest of six;
  three changes of two owners each clear in parallel.
- **Mind the blast radius.** Keep each change's affected build targets / test impact small
  (Bazel/Buck reverse-dependency sets). A small change triggers a cheap, fast presubmit; a
  sprawling one re-runs half the repo.

See `git-workflow-and-versioning` for sizing heuristics and atomic-commit discipline within
each change.

## The Refactor-First Pattern

This is the pattern behind the whole skill. **When you add a feature on top of existing code,
the first changes are pure refactors that reshape the existing code so the feature becomes a
small diff.**

```
Naive: one giant change
  ┌─────────────────────────────────────────────┐
  │ feat: add export-to-CSV                       │
  │  • refactors Report core (300 lines)          │  ← reviewer can't tell
  │  • adds a new formatter abstraction (200)     │     refactor from feature
  │  • adds CSV feature + tests (250)             │
  └─────────────────────────────────────────────┘
                 900 lines, one "LGTM"

Refactor-first: a prepared stack
  [1/4] refactor: extract Report core into a seam     (no behavior change, tests unchanged)
  [2/4] refactor: introduce Formatter interface        (no behavior change, existing formatter
                                                         re-expressed through it)
  [3/4] feat: add CsvFormatter behind a flag           (small — plugs into the seam)
  [4/4] feat: enable CSV export + wire up UI + tests    (small — flips the flag, adds tests)
```

By the time change 4 lands, the "feature" is a tiny diff because changes 1–2 did the structural
work in isolation, where it was easy to verify they changed nothing.

## Dependency Types & Stacking

```
Independent changes             Dependent (stacked) changes

  trunk                           trunk
   ├── A   (off trunk)             └── 1 (off trunk)
   ├── B   (off trunk)                 └── 2 (off 1)
   └── C   (off trunk)                     └── 3 (off 2)

  Land in any order;              Land bottom-up, in order;
  review in parallel.             each builds on the one below.
```

- **Independent changes** — base each on trunk. They don't touch each other; review and land
  in any order. Prefer this whenever the pieces are truly independent — parallel review is faster.
- **Dependent (stacked) changes** — each is based on the previous change, because it needs that
  code to build. Land strictly bottom-up.

**Trunk-based + feature-gated is how partial stacks land safely.** You don't have to wait for
the whole stack to be done before landing the bottom. Land each completed change to trunk with
the incomplete feature **gated behind a flag** (an experiment/config system, or a simple env
flag) so trunk stays releasable and you avoid a long-lived branch. See
`git-workflow-and-versioning`.

## Stacking in Your Review System

**Principle: let the tool track the stack; you choose the decomposition.** Modern review
systems make stacked changes first-class and auto-retarget descendants for you — the manual
rebase dance below is only needed when you have no stacking tool.

### Sapling (Meta-style stacked diffs)
Stacks are the default. Each commit is a change; the stack is just your commit stack.

```sh
sl commit -m "refactor: extract Report core seam"   # change 1
sl commit -m "refactor: introduce Formatter registry"  # change 2 on top
sl pr submit   # or `sl diff` against Phabricator — submits the whole stack
```
Amend a lower change (`sl amend`) and Sapling **auto-restacks** the descendants — no manual
rebase. The UI shows the stack graph; reviewers land bottom-up.

### Phabricator (`arc`)
One commit per change; `arc diff` turns your commit stack into a diff stack.

```sh
arc diff   # creates/updates a Diff per commit; "Depends on Dxxxx" is tracked in the UI
```
The dependency is recorded structurally — reviewers see "Depends on D123" and the stack view.

### Gerrit
One commit = one change, keyed by a `Change-Id` trailer; consecutive commits form a
**relation chain**.

```sh
git commit   # commit-msg hook adds Change-Id: I...
git push origin HEAD:refs/for/main   # each commit becomes a chained Change
```
Submit bottom-up; Gerrit shows the relation chain and blocks out-of-order submits.

### GitHub with a stacking tool
`gh` alone has no native stacks, so teams use a stacking tool that manages bases and
retargeting for you:

```sh
gt create -m "refactor: extract seam"      # Graphite: each branch is a change in the stack
gt create -m "refactor: registry"
gt submit                                  # opens/updates the whole stack of PRs
# (spr is an alternative: one commit per PR, auto-managed)
```
On merge of the bottom PR, the tool retargets the next onto trunk automatically.

### Plain git + GitHub (fallback — only if you have no stacking tool)
Manage bases and rebases by hand:

```sh
git switch -c stack/1-seam main
gh pr create --base main --title "[1/4] refactor: extract seam"

git switch -c stack/2-registry stack/1-seam        # branch off the parent change
gh pr create --base stack/1-seam --title "[2/4] refactor: registry (needs #<1>)"

# After #<1> merges into main:
gh pr edit <2> --base main
git rebase --onto main stack/1-seam stack/2-registry
git push --force-with-lease
```

## Communicating the Dependency

Even when the tool tracks the stack structurally, the **title** should still tell a human
skimming a review queue where this change sits and what it needs first.

**Title conventions:**
- Prefix the stack position: `[2/4]`.
- Name the prerequisite explicitly: `(needs #123)` / `— requires D123`.
- Lead with the change type so the refactor/feature split is visible: `refactor:` / `feat:`.

```
[1/4] refactor: extract Report core into a seam
[2/4] refactor: introduce Formatter registry (needs #1)
[3/4] feat: add CsvFormatter behind a flag (needs #2)
[4/4] feat: enable CSV export + UI (needs #3)
```

**Description template** (put this in every change in the stack so any entry point is self-explanatory):

```
Stack (land in order):
  1 [1/4] refactor: extract seam        ← this change
  2 [2/4] refactor: Formatter registry
  3 [3/4] feat: CsvFormatter behind flag
  4 [4/4] feat: enable CSV export

Base: trunk
Depends on: (none — bottom of stack)
Do not land before: (none)
```

Phabricator, Gerrit, Sapling, and Graphite all render the stack graph natively — so the title
convention is belt-and-suspenders. Keep it anyway: it's what a reviewer reads first in a list
of fifty changes.

## At Scale

The practices that make this work in a large org:

- **Small-change culture.** Google's publicly documented code-review guidance is explicit that
  *small CLs* get reviewed faster and more thoroughly and are easier to roll back. Make "small
  and single-purpose" the default, not the exception — reviewers come to expect it and review
  velocity compounds.
- **Presubmit economics.** Every change must pass presubmit on its own. A small affected-target
  set means cheap, fast, parallelizable signal; a megachange re-runs huge swaths of the repo
  and ties up CI for everyone. Splitting isn't just kindness to reviewers — it's cheaper CI.
- **Ownership-aligned splits.** Fewer owners per change → fewer approvals to gather → faster
  landing. Split along OWNERS/CODEOWNERS lines deliberately.
- **Feature gating over long branches.** Land incomplete stacks to trunk behind flags rather
  than parking work on a branch that diverges for weeks. Trunk stays releasable; integration
  risk stays near zero.
- **Land/merge queues.** Stacks land bottom-up through the queue. Keep stacks **shallow** —
  a ten-deep stack means the top can't land until nine others clear, and a single flake at the
  bottom stalls everything above it.
- **When it's actually a Large-Scale Change (LSC).** If a "refactor" mechanically sweeps
  thousands of files (rename an API across the monorepo), that is *not* a hand-built stack.
  It's the LSC playbook: a **codemod** plus many small, auto-generated, individually-owned
  changes (e.g. tools like Rosie / codemods / `arc`-style sweeps). Don't hand-split 5,000
  files — generate them. See `deprecation-and-migration`.

## Worked Example

A single 900-line change — "add CSV export to Reports" — carved into a reviewable stack
(shown here as GitHub PRs; the same stack is a diff stack in Phabricator/Sapling or a relation
chain in Gerrit):

| Change | Base | Title | What its test proves |
|----|------|-------|----------------------|
| 1 | trunk | `[1/4] refactor: extract Report core into a seam` | Existing report tests pass **unchanged** → behavior preserved |
| 2 | 1 | `[2/4] refactor: introduce Formatter registry (needs #1)` | Existing formatter output is byte-identical through the registry |
| 3 | 2 | `[3/4] feat: add CsvFormatter behind a flag (needs #2)` | New unit tests: CsvFormatter emits correct CSV; flag off = no change |
| 4 | 3 | `[4/4] feat: enable CSV export + UI (needs #3)` | Integration test: user passes `--csv` → valid CSV |

Each change builds and is green on its own. A reviewer approves four ~200-line changes they
fully understand instead of rubber-stamping one 900-line diff. *(This repo's demo ships exactly
this stack as real PRs #2–#5, with the monolith as the contrasting PR #1.)*

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "It's all one feature — splitting is artificial" | The feature is one thing; the refactor that *enables* it is another. Ship them as separate changes. |
| "Reviewers can follow a big change" | They LGTM it instead of reviewing it. Small, single-purpose changes get real scrutiny. |
| "Our monorepo tooling handles big changes fine" | Tooling moves bytes; it doesn't make a 900-line diff reviewable or a wide presubmit cheap. Review quality and CI cost still scale with size. |
| "Stacking adds review overhead" | Native stacking tools make a stack *cheaper* than re-reviewing one megachange every time it changes. The overhead is in the megachange. |
| "I'll split it after it's approved" | Split *before* submitting. Splitting after approval is just unsquashing in reverse, with no review benefit. |
| "The refactor is small enough to include with the feature" | Then it's small enough to be its own quick change. Mixed refactor+feature makes both harder to verify. |
| "It's a 3,000-file rename, splitting is hopeless" | That's an LSC: codemod + auto-generated small changes, not a hand-built stack. |

## Red Flags

- A change title needs the word "and" to be accurate
- A change doesn't build, or doesn't pass presubmit, without an unlanded sibling
- One change mixes a refactor with a behavior change
- A change adds behavior but ships no test for it
- A stack so deep the bottom never lands and the top rots (or the land queue never drains it)
- One change sprawls across many OWNERS, blocking on the slowest approver
- Hand-splitting what should be a codemod / LSC
- The dependency lives only in your head — not in any title, description, or stack graph
- A reviewer has to ask "which change do I start with?"

## Verification

Before submitting the stack, confirm for **every** change:

- [ ] It does exactly one thing (title needs no "and")
- [ ] It builds on its own revision
- [ ] It ships its own tests and the suite is green at its revision
- [ ] It passes presubmit/CI independently, at its position in the stack
- [ ] No change mixes a refactor with a behavior change
- [ ] Refactor changes leave existing tests unchanged and passing
- [ ] Title states stack position `[n/total]` and any prerequisite `(needs …)`
- [ ] Description lists the full stack order and base
- [ ] The stack relationship is tracked by the tool (or bases set correctly in the fallback path)
- [ ] Each change touches a coherent owner set, not the whole org

## Related Skills

- `git-workflow-and-versioning` — atomic commits, trunk-based development, feature flags, change sizing
- `incremental-implementation` — building each change in thin, tested slices
- `code-review-and-quality` — what a reviewable change looks like from the reviewer's side
- `planning-and-task-breakdown` — deciding the split at plan time, before code exists
- `deprecation-and-migration` — the Large-Scale-Change / codemod playbook for repo-wide sweeps
