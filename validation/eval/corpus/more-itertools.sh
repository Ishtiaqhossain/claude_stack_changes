#!/usr/bin/env bash
# Independent corpus entry — more-itertools (Python; code the author didn't build).
# Treat two real feature commits — seekable.__getitem__ and subfactorial() — as one
# bundled change, split into two single-thesis nodes, and prove each builds + tests
# in isolation with the project's own runner (stdlib unittest).
#
# Needs a CURRENT Python (the repo uses 3.10+ syntax). The local sandbox is 3.9, so
# this runs in CI (actions/setup-python @ 3.12) — see VALIDATION.md "Layer 2".
set -euo pipefail
here="$(cd "$(dirname "$0")/../.." && pwd)"
work="$(mktemp -d)"; trap 'rm -rf "$work"' EXIT

git clone -q https://github.com/more-itertools/more-itertools "$work/mit"
cd "$work/mit"
git config user.email corpus@ci.local      # CI runners have no git identity
git config user.name  corpus

SEEKABLE=ba7ef94    # "Add seekable.__getitem__ to access the internal cache"
SUBFACT=842a2b1     # "Add subfactorial()"
base="$(git rev-parse "${SEEKABLE}^")"
git checkout -q -B split "$base"
git cherry-pick --no-edit "$SEEKABLE" >/dev/null && git tag mit-1-seekable      # [1/2]
git cherry-pick --no-edit "$SUBFACT"  >/dev/null && git tag mit-2-subfactorial  # [2/2]

bash "$here/eval/run-eval.sh" \
  "$PWD" "python3 -m unittest discover -s tests -t ." mit-1-seekable mit-2-subfactorial
