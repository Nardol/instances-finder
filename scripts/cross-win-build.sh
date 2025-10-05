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

ICON_DIR="src-tauri/icons"
ICON_PNG="$ICON_DIR/icon.png"
ICON_ICO="$ICON_DIR/icon.ico"

# Ensure a Windows .ico exists (or refresh if PNG changed)
if [ ! -f "$ICON_ICO" ] || [ "$ICON_PNG" -nt "$ICON_ICO" ]; then
  echo "[cross] (Re)generating Windows icon (.ico) from $ICON_PNG"
  if [ ! -f "$ICON_PNG" ]; then
    # Cargo build will generate a minimal PNG via build.rs, so do a quick build step.
    echo "[cross] PNG not found; performing a quick Rust build to seed icon.png"
    (cd src-tauri && cargo build --quiet >/dev/null 2>&1 || true)
  fi
  tauri icon "$ICON_PNG"
fi

echo "[cross] Building Tauri bundle: $BUNDLE_TARGET ($TARGET_TRIPLE)"
# S'appuyer sur TAURI_BUNDLE_TARGETS pour limiter la cible sans utiliser --bundles
export TAURI_BUNDLE_TARGETS="$BUNDLE_TARGET"
tauri build --target "$TARGET_TRIPLE"

echo "[cross] Done. Outputs under src-tauri/target/$TARGET_TRIPLE/release/bundle/"

# Fallback: certains environnements ignorent le bundling en cross-build.
# Si le dossier bundle n'existe pas et que l'on vise 'app', on le crée.
if [ "$BUNDLE_TARGET" = "app" ]; then
  BUNDLE_BASE="src-tauri/target/$TARGET_TRIPLE/release/bundle"
  DLL_PATH="src-tauri/target/$TARGET_TRIPLE/release/WebView2Loader.dll"
  EXE_PATH="$(find "src-tauri/target/$TARGET_TRIPLE/release" -maxdepth 1 -type f -name '*.exe' | head -n 1)"
  if [ ! -d "$BUNDLE_BASE/app" ] && [ -n "$EXE_PATH" ]; then
    echo "[cross] Bundler non exécuté; création d'un bundle portable minimal."
    mkdir -p "$BUNDLE_BASE/app"
    cp -f "$EXE_PATH" "$BUNDLE_BASE/app/" || true
    [ -f "$DLL_PATH" ] && cp -f "$DLL_PATH" "$BUNDLE_BASE/app/" || true
    echo "[cross] Portable prêt: $BUNDLE_BASE/app/"
  fi
fi
