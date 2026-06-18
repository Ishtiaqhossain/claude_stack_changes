# diff_skill

A Claude Code skill — **[`splitting-changes-into-prs`](splitting-changes-into-prs/SKILL.md)** —
plus a worked sample showing it in use.

> **Thesis:** Each PR should do exactly one thing, and should be buildable and testable by itself.

## The skill

[`splitting-changes-into-prs/SKILL.md`](splitting-changes-into-prs/SKILL.md) takes a large
change and carves it into a stack of small, single-purpose PRs. Its headline move is
**refactor-first**: when a feature needs existing code reshaped, the reshaping ships *before*
the feature, as its own PRs, so the feature lands as a small, obvious diff.

## The sample

[`demo/`](demo/) is a tiny Node project: a `Report` module that renders rows as plain text.
The change we want to land is **CSV export**.

```bash
cd demo
npm run build   # syntax-check + run the entry point
npm test        # node --test
```

### Before vs. after — see the PRs

The same ~CSV-export change, landed two ways:

| | PR(s) | What a reviewer sees |
|---|---|---|
| **Before** ❌ | one monolith PR | refactor + new interface + feature + wiring jammed into one commit — impossible to tell safe restructuring from behavior change |
| **After** ✅ | a refactor-first stack of 4 PRs | each PR does one thing, builds and tests on its own, and its title states its stack position and prerequisite |

PR links are listed in the repository's Pull Requests tab. The "after" stack:

```
[1/4] refactor: extract Report core into a seam        (tests unchanged → behavior preserved)
[2/4] refactor: introduce Formatter registry           (tests unchanged → behavior preserved)
[3/4] feat: add CsvFormatter behind a flag             (new CSV unit tests; flag off by default)
[4/4] feat: enable CSV export + wire up CLI            (integration test: --csv emits CSV)
```
