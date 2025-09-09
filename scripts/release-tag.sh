#!/usr/bin/env bash
set -euo pipefail

VERSION="${1:-}"
if [[ -z "${VERSION}" ]]; then
  echo "Usage: $0 vX.Y.Z"
  exit 1
fi

if [[ "${VERSION}" != v* ]]; then
  echo "Version must start with 'v', e.g. v0.1.0"
  exit 1
fi

git tag -a "${VERSION}" -m "${VERSION}"
git push origin "${VERSION}" || {
  echo "Could not push tag. Ensure 'origin' is set and you have permission."
  exit 1
}

echo "Tag ${VERSION} pushed. CI release workflow will build and upload artifacts."

