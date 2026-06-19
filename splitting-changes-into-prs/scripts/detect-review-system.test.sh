#!/usr/bin/env bash
# Fixture tests for detect-review-system.sh. Creates a throwaway repo per case,
# plants the marker(s) for one review system, and asserts the detected mode and
# exit code. Run: bash detect-review-system.test.sh
set -uo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
SCRIPT="$HERE/detect-review-system.sh"
results=0

run_case() { # name  want_mode  want_exit  setup
  local name="$1" want_mode="$2" want_exit="$3" setup="$4"
  local dir; dir="$(mktemp -d)"
  (
    cd "$dir" || exit 99
    git init -q
    eval "$setup"
    out="$("$SCRIPT" 2>/dev/null)"; code=$?
    if [ "$out" = "$want_mode" ] && [ "$code" = "$want_exit" ]; then
      echo "ok   - $name ($out, exit $code)"
    else
      echo "FAIL - $name: want $want_mode/$want_exit, got $out/$code"
      exit 1
    fi
  ) || results=1
  rm -rf "$dir"
}

run_case "phabricator"    phabricator    0 'touch .arcconfig'
run_case "gerrit (.gitreview)" gerrit    0 'touch .gitreview'
run_case "github-stacked" github-stacked 0 'git config spr.branchPrefix x'
run_case "github-plain"   github-plain   1 'git remote add origin https://github.com/x/y.git'
run_case "unknown"        unknown        1 ':'

if [ "$results" -eq 0 ]; then echo "ALL PASS"; else echo "SOME FAILED"; fi
exit "$results"
