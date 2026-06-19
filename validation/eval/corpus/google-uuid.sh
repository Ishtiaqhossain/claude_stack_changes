#!/usr/bin/env bash
# Independent corpus entry — google/uuid (Go; code the author didn't build).
# Treat two real feature commits — Compare() and validation error types — as one
# bundled change, split into two single-thesis nodes, and prove each builds + tests
# in isolation with the project's own runner (`go build` + `go test`).
#
# google/uuid has ZERO dependencies (pure stdlib), so `go test` needs no network.
# Go isn't installed in the local sandbox, so this runs in CI (actions/setup-go) —
# see VALIDATION.md "Layer 2". The split itself (cherry-picks) is pure git and is
# verified locally.
set -euo pipefail
here="$(cd "$(dirname "$0")/../.." && pwd)"
work="$(mktemp -d)"; trap 'rm -rf "$work"' EXIT

git clone -q https://github.com/google/uuid "$work/u"
cd "$work/u"
git config user.email corpus@ci.local      # CI runners have no git identity
git config user.name  corpus

COMPARE=e8d82d3    # feat: add Compare function
ERRTYPES=0e97ed3   # feat: add error types for better validation
base="$(git rev-parse "${COMPARE}^")"
git checkout -q -B split "$base"
git cherry-pick --no-edit "$COMPARE"  >/dev/null && git tag uuid-1-compare    # [1/2]
git cherry-pick --no-edit "$ERRTYPES" >/dev/null && git tag uuid-2-errtypes   # [2/2]

bash "$here/eval/run-eval.sh" \
  "$PWD" "go build ./... && go test ./..." uuid-1-compare uuid-2-errtypes
