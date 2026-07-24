#!/usr/bin/env bash
set -euo pipefail

VERSION="${1:-}"
if [[ -z "${VERSION}" ]]; then
  echo "Usage: $0 vX.Y.Z"
  exit 1
fi

SEMVER_PATTERN='^v(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(-[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?(\+[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?$'
if [[ ! "${VERSION}" =~ ${SEMVER_PATTERN} ]]; then
  echo "Version must be SemVer with a 'v' prefix, e.g. v0.1.0 or v0.2.0-beta.1"
  exit 1
fi

version_without_build="${VERSION%%+*}"
if [[ "${version_without_build}" == *-* ]]; then
  prerelease="${version_without_build#*-}"
  IFS='.' read -r -a identifiers <<< "${prerelease}"
  for identifier in "${identifiers[@]}"; do
    if [[ "${identifier}" =~ ^[0-9]+$ && "${identifier}" != "0" && "${identifier}" == 0* ]]; then
      echo "Numeric prerelease identifiers must not contain leading zeroes: ${identifier}"
      exit 1
    fi
  done
fi

git tag -a "${VERSION}" -m "${VERSION}"
git push origin "${VERSION}" || {
  echo "Could not push tag. Ensure 'origin' is set and you have permission."
  exit 1
}

echo "Tag ${VERSION} pushed. CI release workflow will build and upload artifacts."
