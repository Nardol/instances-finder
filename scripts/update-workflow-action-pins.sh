#!/usr/bin/env bash
set -euo pipefail

# Pin GitHub Actions in .github/workflows to immutable SHAs.
# For actions with moving major tags (v2/v3/v4), we resolve to the latest
# non-prerelease tag within that major and use its commit SHA.
# For dtolnay/rust-toolchain, we pin the current commit of the 'stable' ref.

if ! command -v gh >/dev/null 2>&1; then
  echo "Error: gh CLI is required." >&2
  exit 1
fi

workdir=".github/workflows"
[[ -d "$workdir" ]] || { echo "No workflows dir: $workdir"; exit 0; }

# spec: owner repo ref_selector
# ref_selector examples: v4, v2, v3, stable
specs=(
  "actions checkout v4"
  "actions setup-node v4"
  "actions upload-artifact v4"
  "Swatinem rust-cache v2"
  "softprops action-gh-release v2"
  "github codeql-action v3"
  "dtolnay rust-toolchain stable"
)

mapfile -t files < <(ls -1 "$workdir"/*.yml 2>/dev/null || true)
if [[ ${#files[@]} -eq 0 ]]; then
  echo "No workflow files to update."; exit 0
fi

declare -A pin_sha
declare -A pin_label

get_latest_tag_for_major() {
  local owner="$1" repo="$2" major="$3"
  # Try releases first
  local tag tags
  tags=$(gh api "/repos/${owner}/${repo}/releases?per_page=100" --jq '.[].tag_name' 2>/dev/null || true)
  if [[ -n "$tags" ]]; then
    tag=$(printf '%s\n' "$tags" | grep -E "^v${major}\\." | sort -V | tail -n 1 || true)
  fi
  if [[ -z "$tag" ]]; then
    # Fallback to tags
    tags=$(gh api "/repos/${owner}/${repo}/tags?per_page=100" --jq '.[].name' 2>/dev/null || true)
    if [[ -n "$tags" ]]; then
      tag=$(printf '%s\n' "$tags" | grep -E "^v${major}\\." | sort -V | tail -n 1 || true)
    fi
  fi
  echo "$tag"
}

get_commit_sha_for_ref() {
  local owner="$1" repo="$2" ref="$3"
  gh api "/repos/${owner}/${repo}/commits/${ref}" --jq .sha 2>/dev/null || true
}

for s in "${specs[@]}"; do
  read -r owner repo refsel <<<"$s"
  key="${owner}/${repo}"
  if [[ "$refsel" =~ ^v[0-9]+$ ]]; then
    tag=$(get_latest_tag_for_major "$owner" "$repo" "${refsel#v}")
    if [[ -z "$tag" ]]; then
      echo "Warn: no tag found for $key $refsel" >&2
      continue
    fi
    sha=$(get_commit_sha_for_ref "$owner" "$repo" "$tag")
    pin_sha[$key]="$sha"
    pin_label[$key]="$tag"
  else
    # e.g. stable
    sha=$(get_commit_sha_for_ref "$owner" "$repo" "$refsel")
    pin_sha[$key]="$sha"
    pin_label[$key]="$refsel"
  fi
done

# Replace in-place
for f in "${files[@]}"; do
  tmp="${f}.tmp.$$"
  cp "$f" "$tmp"
  for k in "${!pin_sha[@]}"; do
    sha="${pin_sha[$k]}"; label="${pin_label[$k]}"
    [[ -n "$sha" ]] || continue
    # Escape regex special chars in key for sed
    k_esc=$(printf '%s' "$k" | sed 's/[][(){}.^$|*+?\\/]/\\&/g')
    # Replace any @ref with @sha and add comment with label; preserve optional subpath
    sed -E -i "s|(uses:[[:space:]]*)(${k_esc})(/[^@[:space:]]*)?@[^[:space:]]+|\\1\\2\\3@${sha} # ${label}|g" "$tmp"
  done
  # If we modified, move back
  if ! cmp -s "$f" "$tmp"; then
    mv "$tmp" "$f"
    echo "Updated: $f"
  else
    rm -f "$tmp"
  fi
done

echo "Resolved pins:"
for k in "${!pin_sha[@]}"; do
  echo "- $k => ${pin_sha[$k]} (${pin_label[$k]})"
done
