# Repository Guidelines

## Project Structure & Module Organization

- `src/`: React + TypeScript UI (components/, lib/, mocks/, locales/).
- `src-tauri/`: Tauri host (Rust). Contains `tauri.conf.json`, `src/main.rs`, `build.rs`, `icons/`.
- `dist/`: Generated static frontend build. `index.html` is the Vite entry point.

## Build, Test, and Development Commands

- `npm run tauri:dev`: Run the desktop app in development (Vite on `:5173`, plus Tauri).
- `npm run build`: Build the static frontend into `dist/`.
- `npm run tauri:build:appimage`: Produce a Linux AppImage.
- `npm run tauri:build:deb`: Produce a Debian package (`.deb`).
- Cross-build Windows from Linux (Debian/Ubuntu prerequisites): `mingw-w64 gcc-mingw-w64-x86-64 g++-mingw-w64-x86-64 binutils-mingw-w64-x86-64 nsis`
  - `npm run cross:prep:win`: Configure the Rust target.
  - Portable `.exe`: `npm run cross:build:win:exe`
  - NSIS installer: `npm run cross:build:win:nsis`
- Rust only:
  - `cargo fmt`: Format Rust code.
  - `cargo build`: Build Rust crates when needed.
- Rust lint:
  - `make clippy` (installs Clippy if required), or `cargo clippy`.

## CI

- Build workflow: `.github/workflows/build.yml` (Linux AppImage + Windows NSIS). Artifacts are published under the “Actions” tab.
- Release workflow: `.github/workflows/release.yml` (tags `v*` → attached artifacts). Use `release-draft.yml` for manual runs.

## Makefile Shortcuts

- `make dev`, `make appimage`, `make deb`, `make linux`
- `make cross-prep-win`, `make win-exe`, `make win-nsis`
- `make release-tag VERSION=vX.Y.Z`, `make release-gh VERSION=vX.Y.Z NOTES="..."`
- `make fmt`, `make lint`, `make lint-fix`

## Coding Style & Naming Conventions

- TypeScript: strict mode; 2-space indentation; avoid untyped `any`; use `import type` for types.
- React: component files in PascalCase (`Header.tsx`); utilities in kebab-case (`score.ts`).
- CSS: global styles in `src/styles.css`; at least WCAG AA contrast.
- Rust: default `rustfmt`; functions in `snake_case`, types in `PascalCase`.
- Tooling: ESLint (TS/React/a11y) + Prettier. Fix with `npm run lint:fix` and `npm run fmt`.

## Accessibility Standards (A11y)

- Full keyboard navigation; logical tab order; visible focus states.
- Announcements: use `role="status"`/`role="alert"` with `aria-live` (assertive for critical messages). The token check must be announced.
- Correct HTML semantics (associated labels, native roles). Manual testing: Orca (Linux), NVDA (Windows). Any a11y regression blocks a PR.

## Commit & Pull Request Guidelines

- Concise, present-tense commits: `feat:`, `fix:`, `docs:`, `chore:`.
- PRs: clear description, test steps, screenshot(s) for UI changes, note a11y/performance impacts.
- Link the issue (`Closes #123`) and keep an informal changelog in the PR description.

## Security & Configuration Tips

- Instances.social token: store via the system keyring if the user consents; otherwise keep it only in volatile memory. Never log the token.
- No secrets in the repository; no telemetry. Network access: `instances.social` only (optional proxy, never default).
- Tauri: keep the allowlist minimal (`shell.open`, `clipboard`). Any new native API must be justified and documented.

## Testing Guidelines

- No tests yet. If you add tests: use Vitest + `@axe-core/react`.
- Location: `src/__tests__/*.test.tsx`. Start with core logic (`lib/score.ts`, API filtering) then add DOM a11y tests.
- Error states: on API failure, the UI must display an error (no mock data in production).

## Expert Mode

- Region filter is hidden by default; only visible in “Expert Mode” and labeled “(experimental)”.
- Region is inferred heuristically from TLD; do not make it a blocking rule.
