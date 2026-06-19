#!/usr/bin/env bash
# regen-demo.sh — regenerate the flagship demo stack after the skill changes.
#
# Semi-automated: this script does the mechanical + destructive parts; YOU run the
# skill in between, so you approve the Split Plan (as stack-changes is designed).
#
#   1. validation/scripts/regen-demo.sh teardown --yes   # close old stack PRs + delete expense-stack/*
#   2. run the skill on the monolith (you confirm its plan):
#        /stack-changes split the monolith/expense-report change into a refactor-first
#        stack; name branches expense-stack/<n>-<slug> and open one PR per change.
#   3. validation/scripts/regen-demo.sh finish           # verify the new stack, refresh the README
#
# `teardown` is destructive and DRY-RUN by default — pass --yes to actually act.
set -euo pipefail
cd "$(dirname "$0")/../.."

REPO="$(gh repo view --json nameWithOwner --jq .nameWithOwner 2>/dev/null \
  || git remote get-url origin | sed -E 's#.*github\.com[:/]##; s#\.git$##')"

# Build+test command that works whether the demo sits at demo/ (the frozen stack
# branches) or validation/demo/ — verify-stack runs it after each checkout.
DEMO_CMD='d=demo; [ -d "$d" ] || d=validation/demo; cd "$d" && npm run build && npm test'

stack_branches() { git for-each-ref --format='%(refname:short)' --sort=refname 'refs/heads/expense-stack/*'; }
stack_prs()      { gh pr list --repo "$REPO" --state open --json number,headRefName \
                     --jq '.[] | select(.headRefName|startswith("expense-stack/")) | .number'; }

teardown() {
  local dry=1; [ "${1:-}" = --yes ] && dry=0
  echo "Stack PRs to close (head expense-stack/*):"; stack_prs | sed 's/^/  #/' || true
  echo "Branches to delete:";                        stack_branches | sed 's/^/  /' || true
  if [ "$dry" = 1 ]; then
    echo; echo "DRY RUN — nothing changed. Re-run with --yes to close the PRs + delete the branches."
    return 0
  fi
  for n in $(stack_prs); do gh pr close "$n" --repo "$REPO" --delete-branch || true; done
  for b in $(stack_branches); do
    git branch -D "$b" 2>/dev/null || true
    git push origin --delete "$b" 2>/dev/null || true
  done
  cat <<EOF

Teardown done. Now run the skill on the monolith (you confirm its Split Plan):

  /stack-changes split the monolith/expense-report change into a refactor-first stack;
  name branches expense-stack/<n>-<slug> and open one PR per change.

Then:  validation/scripts/regen-demo.sh finish
EOF
}

finish() {
  local branches vs rc
  branches="$(stack_branches)"
  [ -n "$branches" ] || { echo "No expense-stack/* branches found — did the skill run?"; exit 1; }
  echo "New stack:"; echo "$branches" | sed 's/^/  /'
  echo; echo "Verifying every node builds + tests in isolation…"
  vs="$(mktemp)"; cp validation/scripts/verify-stack.sh "$vs"  # survive branch checkouts
  # shellcheck disable=SC2086
  if bash "$vs" "$DEMO_CMD" $branches; then rc=0; else rc=1; fi
  rm -f "$vs"
  [ "$rc" = 0 ] || { echo; echo "Stack is RED — README NOT updated. Fix the split, then re-run finish."; exit 1; }
  echo; echo "Refreshing the README from the new stack (block + PR numbers)…"
  node validation/scripts/gen-readme.mjs --prs
  git add README.md
  echo; echo "Done. Review 'git diff --staged README.md', then commit + push."
}

case "${1:-}" in
  teardown) teardown "${2:-}";;
  finish)   finish;;
  *) echo "usage: $0 {teardown [--yes] | finish}"; exit 64;;
esac
