#!/usr/bin/env bash
set -euo pipefail

# Cross-compile Windows bundle from Linux with minimal setup.
# Usage: ./scripts/cross-win-build.sh app|nsis

BUNDLE_TARGET="${1:-app}"
TARGET_TRIPLE="x86_64-pc-windows-gnu"
ENV_SUFFIX="x86_64_pc_windows_gnu"

# Detect mingw-w64 prefix (default on Debian/Ubuntu)
PREFIX_DEFAULT="x86_64-w64-mingw32"
PREFIX="${MINGW_PREFIX:-$PREFIX_DEFAULT}"

need_bin() {
  local bin="$1"; shift
  command -v "$bin" >/dev/null 2>&1 || { echo "Missing tool: $bin (install mingw-w64)"; exit 1; }
}

need_bin "${PREFIX}-gcc"
need_bin "${PREFIX}-g++"
need_bin "${PREFIX}-ar"
need_bin "${PREFIX}-windres"

# Ensure Rust target is installed
if ! rustup target list --installed | grep -q "$TARGET_TRIPLE"; then
  rustup target add "$TARGET_TRIPLE"
fi

# Export toolchain vars for Cargo
export CC_${ENV_SUFFIX}="${PREFIX}-gcc"
export CXX_${ENV_SUFFIX}="${PREFIX}-g++"
export AR_${ENV_SUFFIX}="${PREFIX}-ar"
export WINDRES_${ENV_SUFFIX}="${PREFIX}-windres"

echo "[cross] Using $PREFIX toolchain for $TARGET_TRIPLE"
echo "[cross] Building frontend (vite)"
npm run -s build

echo "[cross] Building Tauri bundle: $BUNDLE_TARGET ($TARGET_TRIPLE)"
export TAURI_BUNDLE_TARGETS="$BUNDLE_TARGET"
tauri build --target "$TARGET_TRIPLE"

echo "[cross] Done. Outputs under src-tauri/target/$TARGET_TRIPLE/release/bundle/"

