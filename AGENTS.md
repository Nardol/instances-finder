# AI Agent Guide (Internal)

This file is for the AI assistant working on this repository via Codex CLI. It is not user-facing documentation. Follow these rules first; defer to `README.md` and `CONTRIBUTING.md` for project-specific details.

## Operating Model

- Scope: Make minimal, surgical changes that solve the requested task.
- Safety: Never introduce secrets, telemetry, or new network endpoints.
- Approvals: Ask before running commands that need network or broader permissions.
- Sandboxing: Prefer non-destructive commands; avoid removing or renaming files unless explicitly asked.

## How To Work

- Planning: Use the plan tool for multi-step tasks; keep one step in progress.
- Edits: Use `apply_patch` for file changes; keep diffs focused and small.
- Reading: Use `rg` to search; read files in chunks ≤250 lines.
- Style: Match the existing codebase; do not reformat unrelated code.
- Validation: When possible, run format/lint/build for changed areas only.

## Repository Structure

- `src/`: React + TypeScript UI (components/, lib/, mocks/, locales/).
- `src-tauri/`: Tauri host (Rust) with `tauri.conf.json`, `src/main.rs`, `build.rs`, `icons/`.
- `dist/`: Generated static frontend build. `index.html` is the Vite entry.

## Commands You May Use

- Dev app: `npm run tauri:dev` (Vite on `:5173` + Tauri).
- Build web: `npm run build` → outputs to `dist/`.
- Linux builds: `npm run tauri:build:appimage`, `npm run tauri:build:deb`.
- Windows cross-build (from Linux):
  - Prep toolchain: `npm run cross:prep:win` (Rust target), requires `mingw-w64 ... nsis`.
  - Portable exe: `npm run cross:build:win:exe`
  - NSIS installer: `npm run cross:build:win:nsis`
- Rust only: `cargo fmt`, `cargo build`; lint via `make clippy` or `cargo clippy`.
- Make shortcuts: `make dev | appimage | deb | linux | cross-prep-win | win-exe | win-nsis | fmt | lint | lint-fix`.

## Code & Naming Conventions

- TypeScript: strict; 2-space indent; avoid untyped `any`; prefer `import type`.
- React: components/files in PascalCase (`Header.tsx`); utilities in kebab-case (`score.ts`).
- CSS: global styles in `src/styles.css`; meet WCAG AA contrast.
- Rust: use `rustfmt`; functions `snake_case`, types `PascalCase`.
- Tooling: ESLint (TS/React/a11y) + Prettier; fix with `npm run lint:fix` and `npm run fmt`.

## Accessibility (Blocker Criteria)

- Keyboard: full navigation, logical tab order, visible focus.
- Live regions: use `role="status"`/`role="alert"` with `aria-live` (assertive for critical). Announce token test results.
- Semantics: correct labels and native roles. Manually verify with Orca (Linux) and NVDA (Windows) when applicable.

## Security & Privacy

- Token handling: Instances.social token must be stored via OS keyring if user consents; otherwise keep only in volatile memory. Never log it.
- Network: no new hosts. Only `instances.social` (optional proxy, never default).
- Tauri: keep allowlist minimal (`shell.open`, `clipboard`). Any new native API requires justification and documentation.

## Testing Guidance

- None present yet. If adding tests, use Vitest + `@axe-core/react` in `src/__tests__/*.test.tsx`.
- Prioritize logic tests (`lib/score.ts`, API filtering) before DOM a11y tests.
- Error states: on API failure, show an error message (no fake data in production).

## Git & PR Etiquette

- Commits: concise, present tense: `feat:`, `fix:`, `docs:`, `chore:`.
- PRs: include description, test steps, screenshots for UI, and note a11y/perf impacts. Link issues (e.g., `Closes #123`).

## Expert Mode Rules

- Region filter hidden by default; visible only in “Expert Mode” and labeled “(experimental)”.
- Region is a heuristic from TLD; never block on it.

## Quick Checklist

- Minimal change that solves the task.
- Matches code style and naming conventions.
- Keeps a11y intact or improved.
- No new secrets, telemetry, or network calls.
- Tests or manual steps updated as needed.
