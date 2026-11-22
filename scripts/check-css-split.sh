#!/usr/bin/env sh
# Verifies src/styles/*.css + globals @imports concatenate to legacy globals.css (HEAD).
set -eu
cd "$(dirname "$0")/.."

ORIG="$(mktemp)"
# Monolithic baseline: parent of the commit that introduced src/styles/tokens.css
BASE=$(
  git log --diff-filter=A --format=%H -- src/styles/tokens.css 2>/dev/null | tail -1
)
if [ -n "$BASE" ]; then
  BASE="${BASE}^"
else
  BASE=HEAD
fi
git show "${BASE}:src/app/globals.css" >"$ORIG"

SPLIT="$(mktemp)"
while IFS= read -r line; do
  file=$(printf '%s\n' "$line" | sed -n "s/^@import '..\\/styles\\/\\(.*\\)';$/\\1/p")
  if [ -z "$file" ]; then
    echo "check-css-split: unexpected line in src/app/globals.css: $line" >&2
    exit 1
  fi
  cat "src/styles/$file" >>"$SPLIT"
done <src/app/globals.css

if cmp -s "$ORIG" "$SPLIT"; then
  echo "check-css-split: PASS (concatenated styles match monolithic baseline)"
  rm -f "$ORIG" "$SPLIT"
  exit 0
fi

echo "check-css-split: FAIL — concat differs from monolithic baseline" >&2
diff -u "$ORIG" "$SPLIT" | head -80 >&2
rm -f "$ORIG" "$SPLIT"
exit 1