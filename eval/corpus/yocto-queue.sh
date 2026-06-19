#!/usr/bin/env bash
# Independent corpus entry — sindresorhus/yocto-queue (code the author didn't build).
# Treat the bundled .peek()+.drain() change as one fat change; split it into two
# single-thesis nodes and prove each builds + tests in isolation (objective topo
# check) with the project's own runner. Reproducible + CI-enforceable.
set -euo pipefail
here="$(cd "$(dirname "$0")/../.." && pwd)"
work="$(mktemp -d)"; trap 'rm -rf "$work"' EXIT

git clone -q https://github.com/sindresorhus/yocto-queue "$work/yq"
cd "$work/yq"
npm install --no-audit --no-fund --silent

base="$(git rev-parse 5bf850c^)"                 # before .peek()/.drain()
git checkout -q -B split "$base"
git cherry-pick --no-edit 5bf850c >/dev/null && git tag yq-1-peek    # [1/2] add .peek()
git cherry-pick --no-edit d631ea8 >/dev/null && git tag yq-2-drain   # [2/2] add .drain()

bash "$here/eval/run-eval.sh" "$PWD" "npx ava" yq-1-peek yq-2-drain
