# Repository map — start here if it feels like a lot

This repo is **one small skill wearing a large evidence jacket.** Hold these two layers apart and
the whole thing gets simple.

> **To *use* the skill, you only need `stack-changes/`. Everything else just proves it works.**

## Layer 1 — the product (this is the skill)
| Path | What it is |
|------|------------|
| `stack-changes/SKILL.md` | the instructions the agent runs |
| `stack-changes/reference/*.md` | overflow detail read on demand (why, terminology, at-scale, rationalizations, further-reading) |
| `stack-changes/scripts/detect-review-system.sh` (+ `.test.sh`) | detects GitHub / Sapling / Gerrit / … so the stacking mechanics fit the repo |

Install = copy `stack-changes/` into `~/.claude/skills/`. Nothing below is required for that.

## Layer 2 — the evidence (all under `validation/`; optional)
Exists only to show Layer 1 is trustworthy. **The whole jacket lives in one folder now** —
`validation/` — so you can ignore it in one glance. Each piece answers one reviewer question:

| Path | What it is | Answers |
|------|------------|---------|
| `validation/demo/`, `validation/demo-split/`, `validation/demo-py/` | worked before/after splits (npm + Python) | "show me an example" |
| `validation/scripts/verify-stack.sh` | checks out each split node and builds + tests it | "prove each PR stands alone" |
| `validation/eval/` | grades splits of real *outside* repos (yocto-queue, quick-lru) | "prove it works on repos you didn't build" |
| `validation/VALIDATION.md` | tracks every claim → its proof (asserted → observed) | "is it really validated?" |
| `.github/workflows/ci.yml` | runs all the proofs on every push | keep them honest over time |
| `README.md`, `assets/` | the storefront | presentation |

## If you want to…
- **use / change the skill** → `stack-changes/SKILL.md` (and re-`cp` to `~/.claude/skills/`)
- **see it in action** → `validation/demo/` (npm) or `validation/demo-py/` (Python)
- **check what's proven** → `validation/VALIDATION.md`
- **regenerate the flagship demo after changing the skill** →
  `validation/scripts/regen-demo.sh teardown --yes` → run `/stack-changes` on the monolith →
  `validation/scripts/regen-demo.sh finish` (the README's flagship block + PR numbers update from
  the new stack; `validation/scripts/gen-readme.mjs` is the generator behind it)
- **understand why it's structured this way** → you're reading it
