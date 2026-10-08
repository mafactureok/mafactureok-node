#!/usr/bin/env bash
# Repository hygiene, runnable in CI and before publish (bash 3.2 compatible):
#   - no live API key anywhere in the tree;
#   - invoice files only under examples/factures/ (the synthetic set), nowhere else;
#   - the history follows the one-line, no-attribution rule.
set -uo pipefail
cd "$(git rev-parse --show-toplevel)"
STATUS=0
if git ls-files -z | xargs -0 grep -nE 'mfok_live_[A-Za-z0-9]{24,}' 2>/dev/null; then
  echo "hygiene: a value shaped like a live API key is committed." >&2; STATUS=1
fi
STRAY=$(git ls-files | grep -iE '\.(pdf|xml|jpe?g|png|tiff?)$' | grep -v '^examples/factures/' || true)
if [ -n "$STRAY" ]; then
  echo "hygiene: document files outside examples/factures/:" >&2; echo "$STRAY" >&2; STATUS=1
fi
BAD=$(git log --format='%H%x09%B%x00' | tr -d '\r' | awk 'BEGIN{RS="\0"} { n=split($0, l, "\n"); h=substr(l[1],1,40); s=substr(l[1],42); body=""; for(i=2;i<=n;i++){ if (l[i] ~ /[^ \t]/) body="x" } if (body!="" || tolower(s) ~ /claude|anthropic|co-authored-by|generated with/) print h }')
if [ -n "$BAD" ]; then
  echo "hygiene: commits with a body or an attribution:" >&2; echo "$BAD" >&2; STATUS=1
fi
exit $STATUS
