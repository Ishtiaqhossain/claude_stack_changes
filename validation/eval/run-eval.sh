#!/usr/bin/env bash
# run-eval.sh — score one Split Plan from the decomposition corpus.
#
# Usage: run-eval.sh <repo-dir> "<build+test cmd>" <node-ref> [<node-ref>...]
#
# Runs the OBJECTIVE criterion first — topological validity — by walking the
# proposed stack with verify-stack.sh: every node must build + test *in
# isolation*, which proves no node references code introduced by a later one.
# Then prints the rubric for the judgment criteria to fill in.
#
# The point of the corpus is INDEPENDENCE: the <repo-dir> should be a real
# project the skill's author did not build, and the node refs a stack split from
# one of its real fat commits.
set -uo pipefail
[ "$#" -ge 3 ] || { echo "usage: $0 <repo-dir> \"<cmd>\" <ref>..." >&2; exit 64; }
repo="$1"; cmd="$2"; shift 2
here="$(cd "$(dirname "$0")/.." && pwd)"

echo "### Objective: topological validity — each node builds + tests alone ###"
( cd "$repo" && bash "$here/scripts/verify-stack.sh" "$cmd" "$@" )
topo=$?

echo ""
echo "### Scorecard (objective row auto-filled; judgment rows: fill in) ###"
echo "[$([ "$topo" -eq 0 ] && echo x || echo ' ')] Valid topological order — verify-stack $([ "$topo" -eq 0 ] && echo GREEN || echo RED)  (OBJECTIVE)"
echo "[ ] Refactor/behavior cleanly separated — refactor nodes change no test files"
echo "[ ] No over-splitting — each node justifiable in one sentence without citing a later node"
echo "[ ] Test proof is real — the named test exists and runs at that revision"
echo "[ ] Review-system mechanics correct for the repo"
exit "$topo"
