---
name: splitting-changes-into-prs
description: Splits a large change into small, single-purpose PRs that are each buildable and testable on their own. Use when a diff is too big to review, when a feature builds on existing code, or when you need to land dependent (stacked) PRs and make the ordering clear. Triggers on "split this PR", "break up this change", "stack these PRs".
---

# Splitting Changes Into PRs

## Overview

**Each PR should do exactly one thing, and should be buildable and testable by itself.**

A large change is hard to review well — reviewers skim it, approve it, and miss bugs. A
sequence of small, single-purpose PRs is the opposite: each one is easy to reason about,
reverts cleanly, bisects precisely, and gets *real* review instead of a reflexive LGTM.

This skill is about decomposition: given a change that already exists (or is fully designed),
how do you carve it into a stack of PRs where every PR stands on its own and the ordering is
obvious to a reviewer. The single most important move is **refactor-first** — when a feature
needs existing code reshaped, the reshaping ships *before* the feature, as its own PRs, so the
feature itself lands as a small, obvious diff.

## When to Use

- A diff is over ~400 lines, or touches many files for more than one reason
- A new feature requires changing or reshaping existing code first
- A change mixes concerns: refactor + feature, behavior change + formatting, two features
- You need to land dependent (stacked) PRs and want the dependency to be unambiguous
- Anything that makes a reviewer say "this is a lot — where do I start?"

**When NOT to use:** A genuinely atomic, single-purpose change. Don't split a 30-line bug
fix into a three-PR stack — that's review theater. The goal is *one thing per PR*, not
*minimum lines per PR*.

## The One-Thing Rule

A PR does "one thing" when it passes two acceptance tests:

- **Buildable alone** — checked out on its own, the branch compiles. No references to code
  that only exists in a sibling PR.
- **Testable alone** — the PR ships the tests for its own change, and the full suite is green
  at that PR's HEAD.

> **Litmus test:** Can you write the PR title without the word "and"? If the honest title is
> "Add caching **and** refactor the client", that's two PRs.

A PR that builds but has no way to prove it works is not done — "buildable and testable by
itself" is one requirement, not two optional ones.

## The Decomposition Process

```
1. Map the end state        →  what does the final diff actually touch?
2. Separate refactor/behavior  →  pure refactors first, behavior changes after
3. Order by dependency      →  topological sort: what must merge before what
4. Size each PR             →  ~200–400 lines; split anything bigger
```

### 1. Map the end state

List every file the finished change touches and *why* each is touched. Group the "whys" —
each distinct why is a candidate PR.

### 2. Separate refactors from behavior changes (the load-bearing step)

A **pure refactor** changes structure but not behavior: existing tests pass *unchanged*. A
**behavior change** adds or alters what the code does: it comes with new or modified tests.

Never mix them in one PR. A reviewer reading a mixed PR can't tell which diff lines are
"safe restructuring" and which lines actually change what the system does — so they have to
treat all of it as risky. Split, and each half becomes easy:

- The refactor PR: "tests are identical and still green → behavior is preserved."
- The feature PR: a small diff against already-prepared code → the new behavior is the whole story.

### 3. Order by dependency

Sort the candidate PRs so each one only depends on PRs before it. Refactors that prepare the
ground come first; the feature that uses them comes last.

### 4. Size each PR

Target ~200–400 lines of meaningful diff. Larger logical changes can still be one PR if they
are genuinely one thing, but prefer smaller. See `git-workflow-and-versioning` for sizing
heuristics and atomic-commit discipline within each PR.

## The Refactor-First Pattern

This is the pattern behind the whole skill. **When you add a feature on top of existing code,
the first PRs are pure refactors that reshape the existing code so the feature becomes a small
diff.**

```
Naive: one giant PR
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
  [4/4] feat: enable CSV export + wire up UI/tests      (small — flips the flag, adds tests)
```

By the time PR 4 lands, the "feature" is a tiny diff because PRs 1–2 did the structural work
in isolation, where it was easy to verify they changed nothing.

## Dependency Types & Stacking

```
Independent PRs                 Dependent (stacked) PRs
                                
  main                            main
   ├── pr-a   (off main)           └── pr1 (off main)
   ├── pr-b   (off main)                └── pr2 (off pr1)
   └── pr-c   (off main)                     └── pr3 (off pr2)
                                
  Merge in any order;             Merge bottom-up, in order;
  review in parallel.             each builds on the one below.
```

- **Independent PRs** — branch each off `main`. They don't touch each other; review and merge
  in any order. Prefer this whenever the pieces are truly independent — parallel review is faster.
- **Dependent (stacked) PRs** — each branches off the previous PR's branch, because it needs
  that code to build. Merge strictly bottom-up.

## Concrete git/gh Stacked Workflow

Build the stack, branching each PR off its parent:

```bash
# PR 1 — off main
git switch -c pr1-extract-seam main
# ...work, commit...
gh pr create --base main \
  --title "[1/4] refactor: extract Report core into a seam" \
  --body "$(cat .stack-body.md)"

# PR 2 — off PR 1's branch (it needs PR 1's code to build)
git switch -c pr2-formatter-interface pr1-extract-seam
# ...work, commit...
gh pr create --base pr1-extract-seam \
  --title "[2/4] refactor: introduce Formatter interface (needs #<pr1>)" \
  --body "$(cat .stack-body.md)"

# PR 3 — off PR 2
git switch -c pr3-csv-formatter pr2-formatter-interface
gh pr create --base pr2-formatter-interface \
  --title "[3/4] feat: add CsvFormatter behind a flag (needs #<pr2>)" \
  --body "$(cat .stack-body.md)"
```

**Maintaining the stack.**

When the bottom PR merges, retarget and rebase the next one onto `main`:

```bash
# After #<pr1> merges into main:
gh pr edit <pr2> --base main
git rebase --onto main pr1-extract-seam pr2-formatter-interface
git push --force-with-lease
```

When you edit a lower PR, propagate the change up the stack by rebasing each child on its
parent in order (`git rebase pr1-extract-seam pr2-formatter-interface`, then push
`--force-with-lease`).

> **Tooling note:** `gh` has no native concept of stacks — you manage bases and rebases by
> hand as above. If the team uses a stacking tool (Graphite, `spr`, `git-branchless`), the
> same principles map directly; let the tool do the retargeting.

## PR Titles & Descriptions That Communicate the Dependency

The title alone should tell a reviewer where this PR sits and what it needs first.

**Title conventions:**
- Prefix the stack position: `[2/4]`.
- Name the prerequisite explicitly: `(needs #123)` or `— requires #123`.
- Lead with the change type so the refactor/feature split is visible: `refactor:` / `feat:`.

```
[1/4] refactor: extract Report core into a seam
[2/4] refactor: introduce Formatter interface (needs #101)
[3/4] feat: add CsvFormatter behind a flag (needs #102)
[4/4] feat: enable CSV export + UI (needs #103)
```

**Description template** (put this in every PR in the stack so any entry point is self-explanatory):

```
Stack (merge in order):
  #101 [1/4] refactor: extract seam        ← this PR
  #102 [2/4] refactor: Formatter interface
  #103 [3/4] feat: CsvFormatter behind flag
  #104 [4/4] feat: enable CSV export

Base: main
Depends on: (none — bottom of stack)
Do not merge before: (none)
```

Use GitHub's `Depends on #123` line — it renders as a linked, visible dependency so reviewers
and the merge queue both see it.

## Worked Example

A single 900-line change — "add CSV export to Reports" — carved into a reviewable stack:

| PR | Base | Title | What its test proves |
|----|------|-------|----------------------|
| 1 | `main` | `[1/4] refactor: extract Report core into a seam` | Existing report tests pass **unchanged** → behavior preserved |
| 2 | pr1 | `[2/4] refactor: introduce Formatter interface (needs #101)` | Existing formatter output is byte-identical through the new interface |
| 3 | pr2 | `[3/4] feat: add CsvFormatter behind a flag (needs #102)` | New unit tests: CsvFormatter emits correct CSV; flag off = no change |
| 4 | pr3 | `[4/4] feat: enable CSV export + UI (needs #103)` | Integration test: user clicks Export → downloads valid CSV |

Each PR builds and is green on its own. A reviewer approves four ~200-line PRs they fully
understand instead of rubber-stamping one 900-line diff.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "It's all one feature — splitting is artificial" | The feature is one thing; the refactor that *enables* it is another. Ship them as separate PRs. |
| "Reviewers can follow a big PR" | They LGTM it instead of reviewing it. Small, single-purpose PRs get real scrutiny. |
| "Stacking is too much git overhead" | Less overhead than re-reviewing a 900-line diff every time it changes. Rebasing a stack is mechanical. |
| "I'll split it after it's approved" | Split *before* submitting. Splitting after approval is just unsquashing in reverse, with no review benefit. |
| "The refactor is small enough to include with the feature" | Then it's small enough to be its own quick PR. Mixed refactor+feature makes both harder to verify. |
| "Nobody will merge them out of order" | Encode the order in titles and `Depends on` lines so nobody *can* merge wrong by accident. |

## Red Flags

- A PR title needs the word "and" to be accurate
- A PR doesn't build without an unmerged sibling
- One PR mixes a refactor with a behavior change
- A PR adds behavior but ships no test for it
- A stack so deep the bottom PR never merges and the top rots
- The dependency lives only in your head — not in any title or description
- A reviewer has to ask "which PR do I start with?"

## Verification

Before submitting the stack, confirm for **every** PR:

- [ ] It does exactly one thing (title needs no "and")
- [ ] It builds on its own branch
- [ ] It ships its own tests and the suite is green at its HEAD
- [ ] No PR mixes a refactor with a behavior change
- [ ] Refactor PRs leave existing tests unchanged and passing
- [ ] Title states stack position `[n/total]` and any prerequisite `(needs #…)`
- [ ] Description lists the full stack order and base branch
- [ ] Bases are set correctly (`gh pr edit --base`) and retargeted after parents merge

## Related Skills

- `git-workflow-and-versioning` — atomic commits, branching, change sizing within each PR
- `incremental-implementation` — building each PR in thin, tested slices
- `code-review-and-quality` — what a reviewable change looks like from the reviewer's side
- `planning-and-task-breakdown` — deciding the split at plan time, before code exists
