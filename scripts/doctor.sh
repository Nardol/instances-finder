#!/usr/bin/env bash
set -uo pipefail

pass=0
fail=0
warn=0

note() { printf "[doctor] %s\n" "$*"; }
ok()   { pass=$((pass+1)); printf "[  OK  ] %s\n" "$*"; }
bad()  { fail=$((fail+1)); printf "[ FAIL ] %s\n" "$*"; }
meh()  { warn=$((warn+1)); printf "[ WARN ] %s\n" "$*"; }

have() { command -v "$1" >/dev/null 2>&1; }

check_node() {
  if have node; then
    v=$(node -v 2>/dev/null | sed 's/^v//')
    major=${v%%.*}
    if [ -n "$major" ] && [ "$major" -ge 18 ]; then
      ok "Node.js $v (>=18)"
    else
      bad "Node.js $v (<18). Install Node 18+"
    fi
  else
    bad "Node.js not found. Install Node 18+"
  fi

  if have npm; then
    nv=$(npm -v 2>/dev/null)
    ok "npm $nv"
  else
    bad "npm not found"
  fi
}

check_rust() {
  if have rustc && have cargo; then
    ok "Rust $(rustc --version | awk '{print $2" "$3}')"
  else
    bad "Rust toolchain not found (install rustup + stable)"
  fi

  if have rustup; then
    rustup component list --installed | grep -q '^clippy' \
      && ok "clippy installed" \
      || meh "clippy missing (run: rustup component add clippy)"
    rustup component list --installed | grep -q '^rustfmt' \
      && ok "rustfmt installed" \
      || meh "rustfmt missing (run: rustup component add rustfmt)"
  else
    meh "rustup not found; cannot verify clippy/rustfmt"
  fi
}

check_tauri_cli() {
  if [ -x node_modules/.bin/tauri ]; then
    node_modules/.bin/tauri --help >/dev/null 2>&1 \
      && ok "Tauri CLI found (local devDependency)" \
      || bad "Tauri CLI present but not runnable"
  else
    meh "Tauri CLI not found locally. Run: make ensure-cli"
  fi
}

check_webkitgtk() {
  # Prefer pkg-config checks (portable). Accept 4.0 or 4.1.
  if have pkg-config; then
    if pkg-config --exists webkit2gtk-4.1 || pkg-config --exists webkit2gtk-4.0; then
      ver=$(pkg-config --modversion webkit2gtk-4.1 2>/dev/null || pkg-config --modversion webkit2gtk-4.0 2>/dev/null || echo "unknown")
      ok "WebKitGTK dev found (webkit2gtk $ver)"
    else
      meh "WebKitGTK dev not found via pkg-config"
    fi
  fi

  # Debian/Ubuntu hints via dpkg
  if have dpkg; then
    pkgs=(libwebkit2gtk-4.0-dev libwebkit2gtk-4.1-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev libsoup2.4-dev libjavascriptcoregtk-4.0-dev)
    missing=()
    for p in "${pkgs[@]}"; do
      dpkg -s "$p" >/dev/null 2>&1 || missing+=("$p")
    done
    if [ ${#missing[@]} -eq 0 ]; then
      ok "Debian build deps present (GTK/WebKit/etc.)"
    else
      meh "Missing Debian build deps: ${missing[*]}"
      note "Install example: sudo apt-get install -y ${missing[*]}"
    fi
  fi
}

note "Running development environment checks…"
check_node
check_rust
check_tauri_cli
check_webkitgtk

echo
printf "[doctor] Summary: %d ok, %d warn, %d fail\n" "$pass" "$warn" "$fail"
[ "$fail" -eq 0 ] || exit 1

