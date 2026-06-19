#!/usr/bin/env bash
# detect-review-system.sh — classify the current repo's code-review system and
# report whether it offers a commit-per-change workflow.
#
# Prints exactly one of:
#   sapling | gerrit | phabricator | github-stacked | git-local | github-plain | unknown
# Exit code:
#   0  commit-per-change available (sapling/gerrit/phabricator/github-stacked/git-local)
#   1  branch-per-PR only (github-plain) or unknown
#   2  could not determine a working directory
set -uo pipefail

# Move to the repo root (git or Sapling); otherwise stay where we are.
root="$(git rev-parse --show-toplevel 2>/dev/null)" \
  || root="$(sl root 2>/dev/null)" \
  || root="$PWD"
cd "$root" 2>/dev/null || { echo unknown; exit 2; }

detect() {
  # Sapling — native commit-per-change (the stack is your commit stack).
  if [ -d .sl ] || sl root >/dev/null 2>&1; then
    echo sapling; return
  fi
  # Phabricator / arc — native commit-per-change.
  if [ -f .arcconfig ]; then
    echo phabricator; return
  fi
  # Gerrit — native commit-per-change via Change-Id relation chains.
  if [ -f .gitreview ] \
     || grep -qs Change-Id .git/hooks/commit-msg 2>/dev/null \
     || git log -30 --format='%B' 2>/dev/null | grep -q '^Change-Id:'; then
    echo gerrit; return
  fi
  # GitHub + a stacking tool — commit-per-change *workflow* over branch-per-PR.
  if [ -f .git/.graphite_repo_config ] \
     || git config --get-regexp '^(ghstack|spr)\.' >/dev/null 2>&1 \
     || [ -f .spr.yml ] || [ -f .spr.yaml ]; then
    echo github-stacked; return
  fi
  # Plain GitHub remote — branch-per-PR only.
  if git remote -v 2>/dev/null | grep -qiE 'github\.com'; then
    echo github-plain; return
  fi
  # Local git repo with no recognized remote yet — you still have a local commit
  # stack to reshape (rebase/reset) and submit later. Commit-per-change locally;
  # the remote's mechanics get chosen when you push.
  if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo git-local; return
  fi
  echo unknown
}

mode="$(detect)"
echo "$mode"
case "$mode" in
  sapling|gerrit|phabricator|github-stacked|git-local) exit 0 ;;
  *) exit 1 ;;
esac
