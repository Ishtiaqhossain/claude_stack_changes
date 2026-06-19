#!/usr/bin/env bash
# verify-stack.sh — observe (don't assert) that every node of a stack builds + tests.
#
# Usage: verify-stack.sh "<build+test command>" <ref> [<ref> ...]
#
# Checks out each ref in order, runs the project's OWN command, records green/red,
# and stops at the first red (reporting the failing node). Restores the starting
# ref on exit. This is the runnable form of the skill's "Verify the Stack" loop —
# it reads exit codes, so it works on any build system (npm, python, cargo, go…).
set -uo pipefail
[ "$#" -ge 2 ] || { echo "usage: $0 \"<cmd>\" <ref>..." >&2; exit 64; }
cmd="$1"; shift
nodes=$#
start="$(git symbolic-ref --quiet --short HEAD || git rev-parse HEAD)"
restore() { git checkout -q "$start" 2>/dev/null || true; }
trap restore EXIT

fail=0
for ref in "$@"; do
  if ! git checkout -q "$ref" 2>/dev/null; then
    echo "RED   $ref (checkout failed)"; fail=1; break
  fi
  if bash -c "$cmd" >/tmp/verify-stack.log 2>&1; then
    echo "ok    $ref"
  else
    echo "RED   $ref — stack is invalid at this node:"
    sed 's/^/        /' /tmp/verify-stack.log | tail -10
    fail=1; break
  fi
done

[ "$fail" -eq 0 ] && echo "ALL GREEN ($nodes nodes)" || echo "STOPPED at first red"
exit "$fail"
