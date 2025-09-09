# Instances Finder <VERSION>

Highlights

- Accessible results list with desktop-like keyboard navigation (Enter, Tab, Ctrl/Cmd+Shift+C).
- Tauri host hardened: minimal clipboard allowlist (writeText only) + strict CSP.
- New `xtask` helper (Rust) to speed up dev/build: `make dev`, `make setup`, `make doctor`, packaging via xtask.
- CI uses pinned GitHub Actions (by SHA) and runs xtask binary for checks/builds.
- Unicode guard: pre-commit + CI forbid non-breaking hyphen (U+2011), NBSP (U+00A0), minus (U+2212).

Dev Experience

- `make setup` installs deps (npm ci) and precompiles xtask for fast commands.
- `make doctor` checks Node/Rust/Tauri CLI/WebKitGTK (Linux) and NSIS/WebView2 (Windows).
- `make xtask-release` precompiles xtask; Make auto-detects and prefers the binary.

Known Notes

- With Orca/WebKitGTK, the screen reader may occasionally switch to browse mode on load; focusing the listbox immediately keeps navigation functional. We’ll continue to iterate based on feedback.

Security & Privacy

- Instances.social token stored via OS keyring if user opts in; never logged.
- Network restricted to instances.social (no new hosts).

Thanks for trying the prototype! Feedback welcome, especially on a11y and performance.
