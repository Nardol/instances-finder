#!/usr/bin/env bash
set -euo pipefail

# Create a portable .zip for Windows (exe + DLLs) from macOS or Linux.
# - Builds the Windows "app" bundle via cross-compile (gnu toolchain)
# - Packages the contents of bundle/app into a versioned .zip
#
# Prereqs (macOS):
#   brew install mingw-w64
#   npm run cross:prep:win

TARGET_TRIPLE="${TARGET_TRIPLE:-x86_64-pc-windows-gnu}"
BUNDLE_SUBDIR="src-tauri/target/${TARGET_TRIPLE}/release/bundle"
APP_DIR="${BUNDLE_SUBDIR}/app"

echo "[zip] Building Windows portable bundle for ${TARGET_TRIPLE} (app)"
npm run -s cross:build:win:exe

if [ ! -d "${APP_DIR}" ]; then
  echo "[zip] ERROR: bundle directory not found: ${APP_DIR}" >&2
  exit 1
fi

# Read product name and version
PRODUCT_NAME=$(node -e "console.log(JSON.parse(require('fs').readFileSync('src-tauri/tauri.conf.json','utf8')).package.productName)")
VERSION=$(node -p "require('./package.json').version")

# Sanitize for filenames
NAME_SAFE=$(echo "${PRODUCT_NAME}" | sed -e 's/[^[:alnum:]]\+/-/g' -e 's/^-\|-$//g')
TAG="${NAME_SAFE}_win-x64_portable_v${VERSION}"
STAGE_DIR="${BUNDLE_SUBDIR}/${TAG}"
ZIP_PATH="${BUNDLE_SUBDIR}/${TAG}.zip"

echo "[zip] Staging portable files into ${STAGE_DIR}"
rm -rf "${STAGE_DIR}"
mkdir -p "${STAGE_DIR}"

# Copy all files produced by the portable bundle
cp -a "${APP_DIR}/"* "${STAGE_DIR}/"

# Include license if present
if [ -f LICENSE ]; then
  cp -a LICENSE "${STAGE_DIR}/"
fi

echo "[zip] Creating archive ${ZIP_PATH}"
(cd "${BUNDLE_SUBDIR}" && zip -r -9 "${ZIP_PATH}" "${TAG}" >/dev/null)

echo "[zip] Portable archive ready: ${ZIP_PATH}"

