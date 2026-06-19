# Decomposition corpus (Layer 2)

The weakest evidence in this repo is whether the **split reasoning generalizes** — see
[`../VALIDATION.md`](../VALIDATION.md). The two worked demos are author-built, so they test the
design, not generalization. This corpus closes that gap with **independent** repos.

## What counts as a corpus entry
A real, public project **the skill's author did not build**, plus a **fat commit** from its
history that mixes concerns. You split that commit into a stack of single-thesis changes (as
tags/branches), then grade it. The seam varies by case — refactor + feature is the most common,
but the corpus deliberately also covers other seams (e.g. two independent behaviors), so it tests
the principle, not just one technique. (The `yocto-queue` entry splits `.peek()` + `.drain()` —
two independent behaviors, no refactor.)

## How to run one
```sh
# 1. clone the project; reset to the fat commit's PARENT; reconstruct the proposed
#    stack as refs (one commit per single-thesis change).
# 2. score it — objective topo check + rubric:
eval/run-eval.sh <repo-dir> "<the project's own build+test cmd>" <ref-1> <ref-2> ...
```
`run-eval.sh` runs `verify-stack.sh` over the refs: **every node must build + test in isolation**,
which *objectively* proves topological validity (a node that uses later code can't build alone).
Then it prints the rubric for the judgment criteria.

## Methodology
- **3× per repo** — record a per-repo pass rate; *stable-and-reasonable* is the bar.
- **Span build systems** — Node/Python/Ruby run locally; Go/Cargo/Gradle/Bazel belong in a CI
  matrix with those toolchains (the harness is the same — it just runs the project's command).
- Log results in `VALIDATION.md` with the repo, commit, and scorecard.

Status and the running tally live in [`../VALIDATION.md`](../VALIDATION.md) → "Layer 2".
