#!/usr/bin/env bash
set -euo pipefail

VERSION="${1:-}"
NOTES="${2:-Release ${1:-}}"

if [[ -z "${VERSION}" ]]; then
  echo "Usage: $0 vX.Y.Z [notes]"
  exit 1
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "GitHub CLI (gh) not found. Install: https://cli.github.com/" >&2
  exit 1
fi

# Create tag and draft release (gh will create tag if missing)
gh release create "${VERSION}" --title "${VERSION}" --notes "${NOTES}" --draft

echo "Release ${VERSION} created as draft. CI 'release' workflow will attach artifacts when it runs."

