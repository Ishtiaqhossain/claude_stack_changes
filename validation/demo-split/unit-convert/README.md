# unit-convert

A small command-line unit converter across seven dimensions — **length, mass, temperature,
time, data, area, volume** — used here as a deliberately *large, multi-concern* change to
practice the [`stack-changes`](../../stack-changes/SKILL.md) skill.

## Usage

```bash
cd unit-convert
npm test                      # node --test
npm run build                 # syntax-check + smoke run

node src/index.js 10 km to mi             # 6.2137 mi
node src/index.js 100 C to F              # 212 F
node src/index.js "10 km to mi; 2 hr to min"   # batch
node src/index.js 3.14159 m to ft --precision 2
node src/index.js --list                  # all units, grouped by dimension
node src/index.js 1 kg to lbs             # error + "did you mean \"lb\"?"
```

## Shape (the seams a reviewer would notice)

```
src/units.js     unit table (affine: base = value*factor + offset)
src/convert.js   dimension-checked conversion via the canonical base
src/format.js    precision / significant-figures formatting
src/parse.js     "<value> <from> to <to>" parsing (single + batch)
src/suggest.js   nearest-unit suggestion (Levenshtein) for typos
src/list.js      units grouped by dimension
src/index.js     CLI: flags, batch, error handling
```

This all landed in **one commit** — exactly the kind of change `stack-changes` carves into a
refactor-first stack of single-thesis pieces.
