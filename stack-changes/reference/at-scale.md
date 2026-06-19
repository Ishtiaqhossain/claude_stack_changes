# At Scale

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
