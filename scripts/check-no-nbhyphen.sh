#!/usr/bin/env bash
set -euo pipefail

# Fail if any tracked file contains the Non-Breaking Hyphen (U+2011)
# Prefer the ASCII hyphen '-' in code and docs for tooling compatibility.

mapfile -t hits < <(git ls-files -z | xargs -0 grep -nIH $'\u2011' || true)
if [[ ${#hits[@]} -gt 0 ]]; then
  echo "Found non-breaking hyphen (U+2011) in the following locations:" >&2
  for h in "${hits[@]}"; do echo "  $h" >&2; done
  echo >&2
  echo "Please replace U+2011 (\u2011) with '-' (ASCII hyphen)." >&2
  exit 1
fi
echo "OK: no U+2011 occurrences found."

