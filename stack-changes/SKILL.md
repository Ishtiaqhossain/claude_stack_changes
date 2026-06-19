---
name: stack-changes
description: Splits a large change into small, single-purpose units of review — PRs, diffs, or CLs — each making one argument (one diff, one thesis) and each buildable and testable on its own. Use when a change is too big to review, when a feature builds on existing code, when working in a large monorepo with stacked diffs, or when you need to land dependent changes and make the ordering clear. Triggers on "split this PR/diff/CL", "break up this change", "stack these", "one diff one thesis".
---

# Splitting Changes Into PRs

## Overview

**One diff, one thesis.** Each change should make exactly one argument — and that argument
should be buildable and testable by itself.

Think of a change as a *paragraph with a topic sentence*, or a *proof with a single claim*. The
reviewer's job is to evaluate one thesis: "does this change do what it says, correctly?" If they
can't state the thesis in a sentence, the change is carrying more than one — split it. "One
thing" isn't a size rule; it's a *communication* rule. Size follows from it.

The deepest reason to do this is **empathy for the reviewer.** A small, single-thesis change
respects their attention: it can be reviewed in one sitting, reasoned about completely, and
approved with confidence rather than a reflexive LGTM. A large change is hard to review well —
reviewers skim it, approve it, and miss bugs. A sequence of single-thesis changes is the
opposite: each one is easy to reason about, reverts cleanly, and bisects precisely. As one
senior reviewer put it, small changes are simply *the more empathetic option*.

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

## The One-Thing Rule (One Diff, One Thesis)

A change carries exactly one thesis when it is the *smallest chunk that can be understood,
tested, and rolled back on its own.* Concretely, it passes these acceptance tests:

- **Statable in one sentence** — you can write its thesis without "and." If the honest title is
  "Add caching **and** refactor the client," that's two theses → two changes.
- **Understandable alone** — a reviewer gets the point from *this* diff, without reading the
  changes above or below it in the stack.
- **Buildable alone** — checked out on its own, the revision compiles. No references to code
  that only exists in a sibling change.
- **Testable alone** — the change ships the tests for its own behavior, and the suite is green
  at that change's revision (and passes presubmit/CI independently, at its position in the stack).
- **Revertable alone** — it can be rolled back without dragging unrelated work with it.

A change that builds but has no way to prove it works is not done — "buildable and testable by
itself" is one requirement, not two optional ones.

> **Atomic commits are not atomic reviews.** The unit of review is the *diff a reviewer opens* —
> the whole PR/diff/CL — not your individual commits. Splitting a 900-line change into tidy
> 80-line commits inside **one** PR still asks the reviewer to evaluate 900 lines and many
> theses at once. To make a change reviewable, split the *reviewable unit*: open a **stack** of
> small changes, not one big change with a clean commit history. (Tidy commits are still worth
> it — they just aren't a substitute for splitting the review.)

## Right-Sizing: Don't Over-Split

"One thing" is about a single *concern*, not a minimum line count. The failure mode this
section guards against is the opposite of a megachange: shattering a large change into so many
tiny pieces that the **stack itself** becomes the problem.

Over-splitting has real costs. Every change carries fixed overhead — a review round-trip,
approvals, a CI/presubmit run, a rebase when its parent lands. Twenty changes that only make
sense together cost twenty times that overhead and give the reviewer a *worse* experience than
one well-organized change: they have to hold the whole stack in their head to understand the
first piece.

**Right-size, don't minimize.** Aim for the *fewest* changes that each still do one thing and
stand on their own.

- **Don't split a single concern to hit a line target.** If change 1 can't be understood,
  tested, or motivated without change 2, they're one change. Fold them.
- **Each change must be motivatable alone.** Its description should justify landing it on its
  own terms — not "setup for the next one." A change with no independent value and no test of
  its own is a fragment; merge it upward.
- **Batch trivial, same-concern, same-owner edits.** One "prep" refactor that renames a symbol
  across a module beats one change per call site. (If it's thousands of call sites, it's an
  LSC — see [At Scale](#at-scale).)
- **Keep stacks shallow — roughly 3–7 deep.** A deeper stack usually means one of two things:
  some changes are actually independent and should base on trunk and review in parallel, or the
  work is really a codemod/LSC rather than a hand-built stack.

> **Over-split litmus:** if you can't write a one-line motivation for a change without
> referencing a *later* change in the stack, it's too small. Merge it upward.

The target is a small number of cohesive changes, not the largest possible number of tiny ones.
A large change is not an instruction to produce many PRs — it's an instruction to find the
*natural seams*, which are usually few.

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

Google's eng-practices put numbers on it: **~100 lines is a reasonable CL, ~1000 is usually too
large.** And *distribution matters as much as the count* — 200 lines in one file can be fine,
but 200 lines spread across 50 files is usually too large. Treat one cohesive thesis of a few
hundred lines as the target, but never split a single concern below the point where it can stand
alone (see [Right-Sizing](#right-sizing-dont-over-split)). Two scale-aware criteria sharpen the
split:

- **Split along ownership boundaries.** Carve changes so each one touches a coherent
  OWNERS / CODEOWNERS set. A change needing six teams' approval blocks on the slowest of six;
  three changes of two owners each clear in parallel.
- **Mind the blast radius.** Keep each change's affected build targets / test impact small
  (Bazel/Buck reverse-dependency sets). A small change triggers a cheap, fast presubmit; a
  sprawling one re-runs half the repo.

See `git-workflow-and-versioning` for sizing heuristics and atomic-commit discipline within
each change.

## The Split Plan (the artifact to produce)

Before touching git, emit a **Split Plan** — a predictable artifact the author (or a reviewer)
can sign off on *before* any branches exist. Always produce it in this shape:

```markdown
## Split Plan

### Final goal
<one sentence: what the whole change accomplishes>

### Concerns currently mixed together
1. <concern> — refactor | behavior
2. ...

### Proposed stack
| # | Title | Type | Depends on | Files | Test proof | Risk |
|---|-------|------|------------|-------|------------|------|
| 1 | refactor: extract … seam | refactor | — | a.ts, b.ts | existing tests unchanged | low |
| 2 | feat: add … | feature | #1 | c.ts | new unit test | med |

### Parallelizable changes
<which changes are independent (base on trunk, review in parallel) vs strictly stacked>

### Land order
<bottom-up order; what must merge before what>

### PR/diff/CL description template
Stack (land in order):
  #1 [1/N] …   ← this change
  #2 [2/N] …
Base: <branch>   Depends on: <#prev or none>   Do not land before: <…>
```

Produce this first, get agreement on the *shape*, then execute the mechanics below. The plan is
cheap to revise; a half-built stack of branches is not.

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

## Bad Split vs Good Split

A split is only useful if **every change has a thesis and a proof.** The most common mistake is
splitting by *layer* instead of by *thesis*:

**❌ Bad — split by layer.** Each piece has no independent value and nothing to prove:
```
PR 1: add models
PR 2: add utils
PR 3: add tests
PR 4: wire everything
```
PRs 1–3 don't *do* anything a reviewer can evaluate or a user can use — the behavior only appears
in PR 4. "Add tests" with nothing to test, "add models" that nothing calls: these are fragments,
and a reviewer can't tell if PR 1 is right until PR 4 exists.

**✅ Good — refactor-first, every change has a thesis + proof:**
```
PR 1: refactor existing report into a typed model — no behavior change (existing tests unchanged)
PR 2: introduce a formatter seam — output byte-identical          (existing tests unchanged)
PR 3: add a CSV formatter behind the registry, with its own tests
PR 4: expose CSV in the CLI — end-to-end test
```
Each PR states one thesis and carries its proof: the refactors keep existing tests green (that's
how you know behavior is preserved); the features ship their own tests. You can review, approve,
and roll back any one of them on its own.

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

## Detecting Your Review System

Before you stack, know what you are stacking *on* — the mechanics differ, and only some systems
offer commit-per-change. [`scripts/detect-review-system.sh`](scripts/detect-review-system.sh)
classifies the current repo and tells you which path below to use:

| It prints | Use the mechanics for | Commit-per-change? |
|---|---|---|
| `sapling` | **Sapling** | native |
| `gerrit` | **Gerrit** | native |
| `phabricator` | **Phabricator** | native |
| `github-stacked` | **GitHub + stacking tool** | via tooling (branch-per-PR underneath) |
| `git-local` | **local commits, no remote yet** | yes — locally, until you push |
| `github-plain` | **Plain git + GitHub** | no — branch-per-PR only |

It exits `0` when commit-per-change is available, `1` for branch-per-PR. (Its fixture tests live
beside it in `scripts/detect-review-system.test.sh`.)

**It works before any remote exists.** A `git-local` repo (commits, no remote) is the normal
starting point. Split your **local commit stack** *now* — `git rebase -i` to split/reorder/squash
commits, or `git reset` to uncommit and re-stage in single-thesis pieces — and bind each change
to a PR/diff/CL when you push. The decomposition is the same work whether the review tool is
chosen yet or not.

**Detect and adapt — don't refuse.** Use the result to pick the right *plumbing*, not to gate
the skill out of branch-per-PR repos. The decomposition principles — one diff one thesis,
refactor-first, communicate the dependency — are identical everywhere; only the stacking
commands change. A plain-GitHub team splitting with branches gets exactly the same review
benefit as a Sapling team splitting with commits.

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
GitHub has **no native commit-per-change model.** Its reviewable unit is always a
*branch-to-branch diff* (a PR = head branch vs base branch): you can't push a stack of commits
and have GitHub turn each commit into its own PR, there is no `Change-Id` / relation chain, and
approval and merge happen at the PR level — never per commit. So on GitHub a stack is *always*
branches underneath; the only question is whether **you** manage them or a **tool** does.

A stacking tool (Graphite `gt`, `spr`, `ghstack`) gives you the Sapling/Gerrit-style
**commit-per-change authoring experience on top of** that branch-per-PR substrate: you keep a
local stack of plain commits, and the tool generates and retargets one branch + one PR per
commit for you.

```sh
gt create -m "refactor: extract seam"      # Graphite: each branch is a change in the stack
gt create -m "refactor: registry"
gt submit                                  # opens/updates the whole stack of PRs
# spr / ghstack: you stack plain commits; the tool creates a branch + PR per commit
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
  *small CLs* are reviewed **faster** and **more thoroughly**, have **fewer bugs**, waste less
  effort when rejected, **merge** more cleanly, are **easier to roll back**, and **don't block**
  the author (who can stack the next change while this one is in review). The flip side is review
  *speed*: slow reviews are the top source of developer frustration, and Google's standard is a
  **one-business-day** maximum to respond — a bar small changes make easy to hit and large ones
  make impossible. Make "small and single-thesis" the default, not the exception; review
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
| "Smaller is always better — split it as far as it goes" | Below the single-concern threshold it's worse: more changes means more review round-trips, CI runs, and rebases, plus a reviewer who must read the whole stack to understand change 1. Right-size, don't minimize. |
| "It's a big change, so it should become many PRs" | A big change means *find the natural seams* — usually few. Line count is the symptom; concerns are the unit. One cohesive 400-line change beats five fragments that only make sense together. |
| "Reviewers can follow a big change" | They LGTM it instead of reviewing it. Small, single-purpose changes get real scrutiny. |
| "My commits are atomic, so one big PR is fine" | The reviewer opens the *whole diff*, not your commit list. Atomic commits aren't atomic reviews — split the reviewable unit into a stack. |
| "Splitting just makes the reviewer wait on a chain" | The opposite: small changes hit the one-day-review bar and stack, so you keep moving. It's the megachange that stalls for days. |
| "Our monorepo tooling handles big changes fine" | Tooling moves bytes; it doesn't make a 900-line diff reviewable or a wide presubmit cheap. Review quality and CI cost still scale with size. |
| "Stacking adds review overhead" | Native stacking tools make a stack *cheaper* than re-reviewing one megachange every time it changes. The overhead is in the megachange. |
| "I'll split it after it's approved" | Split *before* submitting. Splitting after approval is just unsquashing in reverse, with no review benefit. |
| "The refactor is small enough to include with the feature" | Then it's small enough to be its own quick change. Mixed refactor+feature makes both harder to verify. |
| "It's a 3,000-file rename, splitting is hopeless" | That's an LSC: codemod + auto-generated small changes, not a hand-built stack. |

## Red Flags

- A change title needs the word "and" to be accurate
- A change doesn't build, or doesn't pass presubmit, without an unlanded sibling
- One change mixes a refactor with a behavior change
- One big PR justified by "the commits are clean" — tidy commits, but the reviewable diff is still huge
- A change whose thesis can't be stated in one sentence without "and"
- A change adds behavior but ships no test for it
- A stack so deep the bottom never lands and the top rots (or the land queue never drains it)
- A change with no independent motivation or test — it exists only as setup for the next one
- A single cohesive concern split across several changes just to hit a line-count target
- A reviewer must read change 7 to understand why change 1 exists
- One change sprawls across many OWNERS, blocking on the slowest approver
- Hand-splitting what should be a codemod / LSC
- The dependency lives only in your head — not in any title, description, or stack graph
- A reviewer has to ask "which change do I start with?"

## Verification

Before submitting the stack, confirm for **every** change:

- [ ] It does exactly one thing (title needs no "and") — but is not a fragment: its motivation stands without referencing a later change
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

## Further Reading

- Google Eng-Practices — **Small CLs**: <https://google.github.io/eng-practices/review/developer/small-cls.html> (the canonical "why and how small," including the ~100/1000-line guidance and separating refactors)
- Google Eng-Practices — **Speed of Code Reviews**: <https://google.github.io/eng-practices/review/reviewer/speed.html> (the one-business-day standard and why review speed is a team-velocity lever)
- The **"one diff, one thesis"** framing — each review should advance a single idea — and the case for stacked PRs over one big PR with atomic commits.
