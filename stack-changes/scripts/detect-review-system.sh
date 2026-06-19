#!/usr/bin/env bash
# detect-review-system.sh — classify the current repo's code-review system and
# report whether it offers a commit-per-change workflow.
#
# Prints exactly one of:
#   sapling | gerrit | phabricator | github-stacked | git-local | github-plain | unknown
# Exit code:
#   0  commit-per-change available (sapling/gerrit/phabricator/github-stacked, or
#      git-local = a repo with no remote yet, where the commit stack is local)
#   1  branch-per-PR only (github-plain — any remote we can't classify as commit-per-change:
#      GitHub.com / GitHub Enterprise, GitLab/Bitbucket cloud-or-self-hosted, Gitea, …)
#   2  unknown / not a git or Sapling repo
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
  # Strong signals (.gitreview, the commit-msg hook) are definitive. A bare
  # Change-Id in recent history is weak: only trust it when there is NO GitHub
  # remote, so a github.com repo that merely imported a Gerrit patch is not
  # misread as Gerrit.
  if [ -f .gitreview ] \
     || grep -qs Change-Id .git/hooks/commit-msg 2>/dev/null \
     || { ! git remote -v 2>/dev/null | grep -qiE 'github\.com|gitlab\.com|bitbucket\.org' \
          && git log -30 --format='%B' 2>/dev/null | grep -q '^Change-Id:'; }; then
    echo gerrit; return
  fi
  # GitHub + a stacking tool — commit-per-change *workflow* over branch-per-PR.
  if [ -f .git/.graphite_repo_config ] \
     || git config --get-regexp '^(ghstack|spr)\.' >/dev/null 2>&1 \
     || [ -f .spr.yml ] || [ -f .spr.yaml ]; then
    echo github-stacked; return
  fi
  # Any configured remote we did NOT classify above as commit-per-change is a branch-per-PR
  # host: GitHub.com or GitHub Enterprise (custom domain), GitLab/Bitbucket (cloud or
  # self-hosted), Gitea, etc. You manage one branch + PR/MR per change. (`github-plain` names
  # this mechanics bucket — it is not a claim that the host is github.com.)
  if git remote -v 2>/dev/null | grep -q .; then
    echo github-plain; return
  fi
  # A git repo with NO remote configured yet — you have a local commit stack to reshape
  # (rebase/reset) and submit later (commit-per-change locally); the host's mechanics get
  # chosen when you add a remote and push.
  if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo git-local; return
  fi
  echo unknown
}

mode="$(detect)"
echo "$mode"
case "$mode" in
  sapling|gerrit|phabricator|github-stacked|git-local) exit 0 ;;
  github-plain) exit 1 ;;
  *) exit 2 ;;   # unknown / not a repo
esac
