---
name: stack-changes
description: Splits a large change into small, single-purpose units of review — PRs, diffs, or CLs — each making one argument (one diff, one thesis) and each buildable and testable on its own. Use when a change is too big to review, when a feature builds on existing code, when working in a large monorepo with stacked diffs, or when you need to land dependent changes and make the ordering clear. Triggers on "split this PR/diff/CL", "break up this change", "stack these", "one diff one thesis".
---

# Splitting Changes Into PRs

## Overview

**One diff, one thesis.** Each change should make exactly one argument — and that argument should
be buildable and testable by itself. "One thing" isn't a size rule; it's a *communication* rule —
if a reviewer can't state the change's thesis in one sentence, it's carrying more than one. Size
follows from that.

This skill is about decomposition: given a change that already exists (or is fully designed),
how do you carve it into a stack where every change stands on its own and the ordering is
obvious to a reviewer. The core move is finding the **natural seams** between theses — the lines
along which one change honestly becomes two. The most common and highest-leverage seam, when a
feature builds on existing code, is **refactor-first**: the reshaping ships *before* the feature,
as its own changes, so the feature itself lands as a small, obvious diff. It's the most useful
technique here — but it is a technique in service of the principle, not the principle itself. A
change that doesn't sit on existing code splits along other seams entirely.

*Why small single-thesis changes matter — empathy for the reviewer, plus review latency, CI cost,
and clean rollback/bisection at org scale: [`reference/why.md`](reference/why.md).*

## Procedure

Run this top to bottom; the rest of the document is the reference for each step.

1. **Detect the review system** — run [`scripts/detect-review-system.sh`](scripts/detect-review-system.sh).
   If you can't run it (no shell / sandbox / permissions), ask the fallback questions in
   [Detecting Your Review System](#detecting-your-review-system) instead of guessing.
2. **Inspect local context** — the change shape, recent history + merge base, ownership/conventions,
   and build/test hints. See [Inspect Local Context](#inspect-local-context-before-you-plan).
3. **Emit a [Split Plan](#the-split-plan-the-artifact-to-produce)** — the proposed stack, ordered
   refactor-first — and **persist it to `STACK_PLAN.md`** so a multi-session stack survives interruptions.
4. **Confirm the plan with the user *before touching git.*** Revise until they agree on the shape.
5. **Execute the mechanics** for the detected system ([Stacking in Your Review System](#stacking-in-your-review-system)).
   **Confirm before any history rewrite or force-push** (see the Safety note there).
6. **Verify** — run the [per-revision loop](#verify-the-stack-per-revision) (checkout → build → test each node) and confirm the [Verification checklist](#verification).
7. **Communicate the dependency** in every title and description.

## A Note on Terminology

This skill says **"change"** for the unit of review — a **PR** (GitHub), **diff**
(Phabricator/Sapling), or **CL** (Critique/Gerrit); a **stack** is the dependent series. Full
mapping table: [`reference/terminology.md`](reference/terminology.md).

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
> the whole PR/diff/CL. Tidy 80-line commits inside **one** 900-line PR still ask the reviewer to
> evaluate 900 lines at once. Split the *reviewable unit*: open a **stack** of small changes.

## Right-Sizing: Don't Over-Split

"One thing" is a single *concern*, not a minimum line count. Over-splitting has real costs — every
change is a review round-trip, a CI run, and a rebase when its parent lands — so a stack of twenty
interdependent tiny pieces is *worse* than one well-organized change. **Aim for the fewest changes
that each still do one thing and stand on their own:**

- **Don't split a single concern to hit a line target.** If change 1 can't be understood, tested,
  or motivated without change 2, fold them.
- **Each change must be motivatable alone** — its description justifies landing it on its own
  terms, not "setup for the next one." No independent value and no test of its own = a fragment;
  merge it upward.
- **Batch trivial, same-concern, same-owner edits** — one "prep" refactor, not one change per call
  site. (Thousands of call sites = an LSC; see [At Scale](#at-scale).)
- **Keep stacks shallow — roughly 3–7 deep.** Deeper usually means some changes are independent
  (base on trunk, review in parallel), or the work is really a codemod/LSC.

> **Over-split litmus:** if you can't write a one-line motivation for a change without referencing
> a *later* change in the stack, it's too small. Merge it upward.

## The Decomposition Process

```
1. Map the end state          →  what does the final diff actually touch?
2. Find the seams             →  split by thesis; refactor-vs-behavior is the most common seam
3. Order by dependency        →  topological sort: what must land before what (refactors first)
4. Size & scope each change   →  ~200–400 lines; one owner set; small blast radius
```

### 1. Map the end state

List every file the finished change touches and *why* each is touched. Group the "whys" —
each distinct why is a candidate change.

### 2. Find the seams (refactor vs behavior is the most common one)

A seam is a line along which one change honestly becomes two. Look for these, in rough order of
how often they pay off:

- **Refactor vs behavior** — the most common and highest-leverage seam (detailed below).
- **Independent feature vs independent feature** — two things that don't depend on each other
  base on trunk and review in parallel; don't stack what isn't dependent.
- **Behavior change vs behavior change** — two distinct behaviors are two theses, even if they
  touch the same file.
- **Ownership boundary** — a change spanning several OWNERS/CODEOWNERS sets splits so each piece
  has one coherent owner set (see step 4).
- **Risky vs safe** — isolate the risky, hard-to-review part so the rest lands trivially.

**The refactor/behavior seam.** A **pure refactor** changes structure but not behavior: existing
tests pass *unchanged*. A **behavior change** adds or alters what the code does: it comes with new
or modified tests.

Never mix them in one change. A reviewer reading a mixed change can't tell which diff lines are
"safe restructuring" and which lines actually change what the system does — so they have to
treat all of it as risky. Split, and each half becomes easy:

- The refactor change: "assertions unchanged and still green → behavior is preserved."
- The feature change: a small diff against already-prepared code → the new behavior is the whole story.

**Split by thesis, not by layer.** "PR1: models, PR2: utils, PR3: tests, PR4: wire it up" is the
classic bad split — each piece has no independent value and nothing to prove until the last. Every
change carries its own thesis *and* its proof. (Worked example: [`reference/why.md`](reference/why.md).)

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

## Inspect Local Context (before you plan)

A Split Plan is only as good as what you know about the repo. **Gather this first** — guessing
produces a plausible-but-wrong plan. Run only the commands that apply (skip what isn't present).

1. **Current change shape** — what you're actually splitting:
   ```sh
   git status --short
   git diff --stat ; git diff --name-only        # unstaged
   git diff --cached --stat                        # staged, if any
   ```
2. **Recent history & base** — where the stack roots and what's idiomatic here:
   ```sh
   git log --oneline -n 10
   git branch --show-current
   # Trunk = the remote's default branch — DON'T assume `main` (could be master/develop/trunk,
   # or a non-`origin` remote). Resolve it, then take the merge base = the stack's base:
   trunk=$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD 2>/dev/null) # e.g. origin/main
   trunk=${trunk:-origin/main}                     # fallback; `git remote set-head origin -a` populates it
   git merge-base HEAD "$trunk"
   ```
3. **Review system** — run [`scripts/detect-review-system.sh`](scripts/detect-review-system.sh)
   (or the [fallback questions](#detecting-your-review-system)).
4. **Ownership & conventions** — read if present: `CODEOWNERS` / `OWNERS` (split along owner
   boundaries), `.github/pull_request_template.md` (match the PR body), `CONTRIBUTING.md`,
   `CLAUDE.md` (house rules, commit/PR conventions).
5. **Build/test hints** — so each change's *Test proof* is real, not aspirational. Inspect the
   manifest(s) — `package.json`, `pnpm-lock.yaml`, `pom.xml`, `build.gradle`, `Cargo.toml`,
   `go.mod`, `pyproject.toml`, `BUCK` / `BUILD`, etc. — and identify the test command (and, if you
   can, the affected targets) for each proposed change.

**Feed it into the plan:** change shape → the proposed stack · merge base → the **Base** ·
`CODEOWNERS`/`OWNERS` → how you carve and order · manifests → the **Test proof** column ·
conventions/template → the description template.

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

**Persist it — one on-disk source of truth.** Write the plan to `STACK_PLAN.md` at the repo root,
and **add `STACK_PLAN.md` to `.gitignore` yourself** (it's working state — don't leave an
uncommitted artifact behind). For a deep stack worked across more than one session this is
the anchor: on **resume**, read `STACK_PLAN.md`, re-run the
[per-revision loop](#verify-the-stack-per-revision) to find the first unbuilt/red node, and
continue from there — instead of re-deriving the plan from scratch and risking drift. Keep the
file current as the plan changes (check off landed nodes).

## The Refactor-First Pattern

**When you add a feature on top of existing code, the first changes are pure refactors that reshape
the existing code so the feature becomes a small diff.** The refactors land first, each proving it
changed nothing (existing tests pass *unchanged*); by the time the feature change lands, it's a
tiny diff against already-prepared code. When a change doesn't sit on existing code, there's nothing
to refactor first — split along the other
[seams](#2-find-the-seams-refactor-vs-behavior-is-the-most-common-one).

*(This repo's `validation/demo/` carries this further — an expense-report monolith carved into a
refactor-first stack of small PRs.)*

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
| `github-plain` | **Plain branch-per-PR** — any remote we can't classify (GitHub/GHE, GitLab/Bitbucket, self-hosted) | no — branch-per-PR only |

It exits `0` when commit-per-change is available, `1` for branch-per-PR (`github-plain`), and `2`
for an unknown / non-repo dir. Its full fixture matrix — every row above plus adversarial cases —
lives beside it in `scripts/detect-review-system.test.sh` and runs in CI on every push.

**The detector is a heuristic — treat the output as a hint and override it when it's wrong.**
Known failure modes:
- **`gerrit` fires only on strong signals** — `.gitreview` or the commit-msg hook. A bare
  `Change-Id:` in history counts *only when there's no GitHub remote*, so a github.com repo that
  imported a Gerrit patch stays `github-plain` (an adversarial fixture pins this). Residual: a
  *non-GitHub* repo with a stray Change-Id and no `.gitreview`/hook can still read as `gerrit` —
  if you don't push to `refs/for/*`, you're not on Gerrit.
- **Graphite needs its config** — it looks for `.git/.graphite_repo_config`; a Graphite user who
  hasn't `gt init`-ed degrades to `github-plain` (a fixture documents this). If you use `gt`,
  treat it as `github-stacked`.
- **Any unclassified remote → `github-plain`.** GitLab/Bitbucket (cloud or self-hosted),
  **GitHub Enterprise on a custom domain** (`github.acme.com`, `git.acme.com` — we can't fingerprint
  these from the URL), Gitea, etc. all route to `github-plain` (branch-per-PR), *not* `git-local`.
  `git-local` (exit 0, commit-per-change) now means **no remote configured yet** — a true local
  commit stack. If the detector is wrong about a custom host's exact tool, the mechanics are still
  branch-per-PR; only the CLI differs (`glab`/web instead of `gh`).

**If you can't run the script**, don't guess — ask the user three questions:
1. Where do code reviews happen — GitHub PRs, Phabricator/Sapling diffs, Gerrit CLs, or just
   local commits for now?
2. Do you use a stacking tool (Graphite `gt`, `spr`, `ghstack`)?
3. Is there a remote yet, or is this local-only?

Then pick the matching mechanics below.

**It works before any remote exists.** A `git-local` repo (commits, no remote) is the normal
starting point. Split your **local commit stack** *now* — `git rebase -i` to split/reorder/squash
commits, or `git reset` to uncommit and re-stage in single-thesis pieces — and bind each change
to a PR/diff/CL when you push. The decomposition is the same work whether the review tool is
chosen yet or not.

**Detect and adapt — don't refuse.** The result picks the *plumbing*, not whether to split. The
decomposition (one diff one thesis, refactor-first, communicate the dependency) is identical
everywhere; only the stacking commands change.

## Stacking in Your Review System

**Principle: let the tool track the stack; you choose the decomposition.** Modern review
systems make stacked changes first-class and auto-retarget descendants for you — the manual
rebase dance below is only needed when you have no stacking tool.

> **Strongly prefer a stacking tool (or a native commit-per-change system) over the manual path.**
> The plain-git `git rebase --onto` fallback is the **riskiest thing this skill does** — a wrong
> base silently corrupts the stack, and an agent driving it can't always see the corruption. Use it
> only as a last resort; rebase one branch at a time, and **re-run the [per-revision verify
> loop](#verify-the-stack-per-revision) after each rebase** so a bad base fails loudly instead of
> rotting the stack.

> **⚠ Safety — history rewrite & force-push.** Several mechanics below run `git rebase` / `git reset`
> (which rewrite history) and `git push --force-with-lease`. **Confirm with the user before
> rewriting history or force-pushing, and never force-push a shared or protected branch**
> (`main`/`master`, a release branch, or anyone else's branch). Force-push only *your own* stack
> branches. These are hard-to-reverse, outward-facing actions — pause and check first.

> **Tool specifics drift.** The behaviors below (Sapling auto-restack, Graphite auto-retarget on
> merge, the exact `gt` / `spr` / `ghstack` flags) are current as of writing. If an invocation has
> changed, the *principle* still holds — confirm the exact command against the tool's own docs.

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

### Plain git + GitHub (fallback — last resort, no stacking tool; the riskiest path)
Manage bases and rebases by hand — verify after every rebase (see the warning above):

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

Splitting is load-bearing in a large org: small-change culture (Google's small-CL guidance),
presubmit economics, ownership-aligned splits, feature-gating over long branches, shallow stacks
for land queues, and the **LSC/codemod escape hatch** for repo-wide sweeps (don't hand-split a
3,000-file rename — generate it). Full notes: [`reference/at-scale.md`](reference/at-scale.md).

## Verify the Stack (per-revision)

Don't *assert* that each change builds — **observe it.** The skill doesn't need to understand
Bazel vs Cargo vs npm; it runs the *project's own* build and test command and reads the exit
code. That portability is the whole point.

1. **Find the build + test command** — from the manifest you read in
   [Inspect Local Context](#inspect-local-context-before-you-plan), or ask the user. Default to
   whatever the repo's CI runs. Examples:
   `npm run build && npm test` · `cargo build && cargo test` · `go build ./... && go test ./...` ·
   `mvn -q verify` · `./gradlew test` · `pytest` · `bazel test //...`.
2. **Walk the stack bottom-up.** For each change, in order:
   ```sh
   git checkout <change-ref>     # or `sl goto`, etc.
   <build command>              # exit non-zero on failure
   <test command>
   ```
   Record green/red for that node.
3. **Stop at the first red.** A red node means the stack is invalid there — a change references
   code introduced by a later one, or a "refactor" actually changed behavior. **Report which node
   failed and why; do not present an unverified stack as done.** Fix the decomposition, re-verify.

A **refactor** change has a sharper check: build + test green **and** the test *assertions and
expected outputs* are unchanged from the parent. **Byte-identical test files** (`git diff <parent>
-- <test paths>` is empty) is the *strongest* form of that proof — but it's sufficient, not
necessary. A legitimate pure refactor can still touch test files *mechanically*: a rename updates
call sites, a file move updates import paths. So the real invariant is "no asserted value or
expected output changed"; when a refactor must edit tests, confirm the diff is purely mechanical
(names/paths), with every assertion intact.

> When done, restore the user's working state (`git checkout -` / their branch) — don't leave
> them on a detached revision. And per the Safety note, confirm before any rebase/force-push.

## Verification

Before submitting, confirm every change passes the
[One-Thing Rule acceptance tests](#the-one-thing-rule-one-diff-one-thesis) (statable in one
sentence, understandable / buildable / testable / revertable alone, not a fragment) — and, at the
stack level:

- [ ] No change mixes a refactor with a behavior change; refactor changes leave the test **assertions / expected outputs** unchanged and passing (mechanical edits — renames, import paths — are fine)
- [ ] It passes presubmit/CI independently, at its position in the stack
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

- Rebuttals to common excuses ("it's fine as one big change," "I'll split after approval," "atomic
  commits = atomic review"): [`reference/rationalizations.md`](reference/rationalizations.md).
- Google's **Small CLs** + **Speed of Code Reviews**, and the "one diff, one thesis" framing:
  [`reference/further-reading.md`](reference/further-reading.md).
