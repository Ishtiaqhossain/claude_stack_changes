#!/usr/bin/env bash
# Fixture matrix for detect-review-system.sh. Each case creates a throwaway repo,
# plants the marker(s) for one review system, and asserts both the printed label
# and the exit code. Run: bash detect-review-system.test.sh
#
# Exit codes asserted: 0 commit-per-change · 1 branch-per-PR (github-plain) ·
# 2 unknown / not a repo.
set -uo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
SCRIPT="$HERE/detect-review-system.sh"
GH='https://github.com/acme/app.git'
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

commit() { git -c user.email=a@b.c -c user.name=x commit -q --allow-empty -m "$1"; }

# ---- the matrix ----
run_case "sapling (.sl dir)"             sapling        0 'mkdir .sl'
run_case "gerrit (.gitreview)"           gerrit         0 'touch .gitreview'
run_case "gerrit (commit-msg hook)"      gerrit         0 'mkdir -p .git/hooks; printf "%s\n" "# Change-Id" > .git/hooks/commit-msg'
run_case "phabricator (.arcconfig)"      phabricator    0 'touch .arcconfig'
run_case "graphite (.graphite cfg)"      github-stacked 0 'touch .git/.graphite_repo_config'
run_case "spr/ghstack (git config)"      github-stacked 0 'git config spr.branchPrefix x'
run_case "ghstack (git config)"          github-stacked 0 'git config ghstack.remote origin'
run_case "spr (.spr.yml file)"           github-stacked 0 'touch .spr.yml'
run_case "plain github"                  github-plain   1 "git remote add origin $GH"
run_case "git-local (no remote)"         git-local      0 'commit c1'
run_case "not a repo (empty dir)"        unknown        2 'rm -rf .git'

# ---- adversarial: where the bugs live ----
# A github.com repo that merely imported a Gerrit patch must NOT read as gerrit.
run_case "github + stray Change-Id"      github-plain   1 "git remote add origin $GH; commit 'port fix

Change-Id: Iabc123'"
# A Sapling repo backed by a GitHub remote must stay sapling.
run_case "sapling on a github remote"    sapling        0 "mkdir .sl; git remote add origin $GH"
# Documented degrade: a Graphite user without .git/.graphite_repo_config looks
# like plain github. (Acceptable — the agent treats the output as a hint; see SKILL.md.)
run_case "graphite w/o config (degrade)" github-plain   1 "git remote add origin $GH"
# GitLab/Bitbucket with a remote are MR-based branch-per-PR — NOT a local-only stack.
run_case "gitlab remote"                 github-plain   1 "git remote add origin https://gitlab.com/acme/app.git"
run_case "bitbucket remote"              github-plain   1 "git remote add origin git@bitbucket.org:acme/app.git"
# A GitLab repo with a stray Change-Id must not read as gerrit either.
run_case "gitlab + stray Change-Id"      github-plain   1 "git remote add origin https://gitlab.com/acme/app.git; commit 'x

Change-Id: Iabc'"
# GitHub Enterprise / self-hosted on a custom domain: an unclassified remote is
# branch-per-PR, NOT a local-only stack (the exit-code-contract fix — exit 1, not 0).
run_case "GHE custom-domain remote"      github-plain   1 "git remote add origin https://github.acme.com/team/app.git"
run_case "self-hosted (git.acme.com)"    github-plain   1 "git remote add origin git@git.acme.com:team/app.git"

# cd-to-root: the script must classify from a SUBDIRECTORY, not only the repo root.
sub="$(mktemp -d)"
(
  cd "$sub" || exit 99
  git init -q; git remote add origin "$GH"; mkdir -p a/b; cd a/b
  out="$("$SCRIPT" 2>/dev/null)"; code=$?
  if [ "$out" = github-plain ] && [ "$code" = 1 ]; then
    echo "ok   - runs from a subdirectory ($out, exit $code)"
  else
    echo "FAIL - subdirectory: want github-plain/1, got $out/$code"; exit 1
  fi
) || results=1
rm -rf "$sub"

if [ "$results" -eq 0 ]; then echo "ALL PASS"; else echo "SOME FAILED"; fi
exit "$results"
