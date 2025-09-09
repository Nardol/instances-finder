#!/usr/bin/env bash
set -euo pipefail

# Forbid a small set of Unicode punctuation that causes tooling issues in code/docs:
# - U+2011 NON-BREAKING HYPHEN (looks like '-')
# - U+00A0 NO-BREAK SPACE (looks like space)
# - U+2212 MINUS SIGN (looks like '-')

declare -A PATTERNS=(
  ["U+2011 non-breaking hyphen"]=$'\u2011'
  ["U+00A0 no-break space"]=$'\u00A0'
  ["U+2212 minus sign"]=$'\u2212'
)

fail=0
for name in "${!PATTERNS[@]}"; do
  pat=${PATTERNS[$name]}
  hits=$(git ls-files -z | xargs -0 grep -nIH --color=never "$pat" || true)
  if [[ -n "$hits" ]]; then
    echo "Forbidden character found ($name):" >&2
    echo "$hits" >&2
    fail=1
  fi
done

if [[ $fail -ne 0 ]]; then
  echo >&2
  echo "Please replace with ASCII equivalents: '-' for hyphen/minus, ' ' for spaces." >&2
  exit 1
fi

echo "OK: no forbidden Unicode punctuation found."

