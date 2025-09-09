# Repository Guidelines

## Project Structure & Module Organization
- `src/`: React + TypeScript UI (components/, lib/, mocks/, locales/).
- `src-tauri/`: hôte Tauri (Rust), `tauri.conf.json`, `src/main.rs`, `build.rs`, `icons/`.
- `dist/`: build frontend (généré).  `index.html` sert d’entrée Vite.

## Build, Test, and Development Commands
- `npm run tauri:dev`: lance l’app en dev (Vite sur `:5173`, Tauri).
- `npm run build`: build frontend statique dans `dist/`.
- `npm run tauri:build:appimage`: produit un AppImage Linux.
- `npm run tauri:build:deb`: produit un paquet Debian (.deb).
- Cross‑build Windows depuis Linux (prérequis Debian/Ubuntu): `mingw-w64 gcc-mingw-w64-x86-64 g++-mingw-w64-x86-64 binutils-mingw-w64-x86-64 nsis`
  - `npm run cross:prep:win` (cible Rust) puis
  - `.exe portable`: `npm run cross:build:win:exe`
  - Installeur NSIS: `npm run cross:build:win:nsis`
- Rust only: `cargo fmt` (formatage), `cargo build` si besoin.
 - Rust lint: `make clippy` (installe Clippy si nécessaire), ou `cargo clippy`.

## CI
- Workflow GitHub Actions: `.github/workflows/build.yml` (Linux AppImage + Windows NSIS). Artefacts publiés dans l’onglet “Actions”.
- Workflow release: `.github/workflows/release.yml` (tags v* → artefacts attachés). `release-draft.yml` pour lancement manuel.

## Makefile Shortcuts
- `make dev`, `make appimage`, `make deb`, `make linux`
- `make cross-prep-win`, `make win-exe`, `make win-nsis`
- `make release-tag VERSION=vX.Y.Z`, `make release-gh VERSION=vX.Y.Z NOTES="..."`
 - `make fmt`, `make lint`, `make lint-fix`

## Coding Style & Naming Conventions
- TypeScript: strict, indent 2 espaces, pas d’`any` non justifié; `import type` pour les types.
- React: composants et fichiers de composants en PascalCase (`Header.tsx`), utilitaires en kebab‑case (`score.ts`).
- CSS: styles globaux dans `src/styles.css`, contraste AA minimum.
- Rust: `rustfmt` par défaut; fonctions en `snake_case`, types en `PascalCase`.
- Outils: ESLint (TS/React/a11y) + Prettier. Corrigez avec `npm run lint:fix` et `npm run fmt`.

## Accessibility Standards (A11y)
- Navigation clavier complète; ordre de tabulation logique; focus visible.
- Annonces: utilisez `role="status"`/`role="alert"` + `aria-live` (assertive pour messages critiques). Le test du jeton doit être annoncé.
- Sémantique HTML correcte (labels associés, rôles natifs). Tests manuels: Orca (Linux), NVDA (Windows). Toute régression a11y bloque une PR.

## Commit & Pull Request Guidelines
- Commits concis, au présent: `feat:`, `fix:`, `docs:`, `chore:`.
- PR: description claire, étapes de test, capture d’écran si UI, mention des impacts a11y/perf.
- Liez l’issue (`Closes #123`) et tenez le changelog informel dans la description.

## Security & Configuration Tips
- Jeton Instances.social: stocké via le trousseau (keyring) si l’utilisateur l’accepte, sinon mémoire volatile. Ne logguez jamais le jeton.
- Pas de secrets en repo; pas de télémétrie. Réseau: `instances.social` uniquement (proxy optionnel, jamais par défaut).
- Tauri: allowlist minimale (`shell.open`, `clipboard`). Toute nouvelle API native doit être justifiée et documentée.

## Testing Guidelines
- Pas encore de tests. Si vous en ajoutez: Vitest + @axe-core/react.
- Emplacement: `src/__tests__/*.test.tsx`. Ciblez d’abord la logique (`lib/score.ts`, filtrage API) puis des tests a11y DOM.
- État d’erreur: en cas d’échec API, l’UI doit afficher un message d’erreur (pas de données fictives en production).

## Expert Mode
- Masque par défaut le filtre Région; visible uniquement en “Mode expert” et marqué “(expérimental)”.
- Région déduite heuristiquement via TLD; ne pas en faire une logique bloquante.
