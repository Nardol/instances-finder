# Contributing Guide

Merci de votre intérêt pour ce projet. Cette page complète le README et décrit comment contribuer efficacement.

## Start Here

- Lisez le [README](./README.md) pour l’installation et les commandes.
- Respectez les règles ci‑dessous (style, accessibilité, sécurité, PR).

## Code de conduite

- Soyez bienveillant·e et précis·e. Donnez du contexte et des repros courts.
- Pas de contenu nuisible, discriminatoire ou agressif.
- Les mainteneurs peuvent fermer des issues/PR qui ne respectent pas ces règles.

## Development Quickstart

- Dépendances: voir README (paquets system + Node + Rust).
- Installer: `npm install`
- Dev: `npm run tauri:dev`
- Build AppImage: `npm run tauri:build:appimage`
- Build Debian (.deb): `npm run tauri:build:deb`
- Cross‑build Windows (depuis Linux):
  - Prérequis: `sudo apt install -y mingw-w64 gcc-mingw-w64-x86-64 g++-mingw-w64-x86-64 binutils-mingw-w64-x86-64 nsis`
  - Préparer la cible Rust: `npm run cross:prep:win`
  - `.exe`: `npm run cross:build:win:exe` | `nsis`: `npm run cross:build:win:nsis`

### Makefile (optionnel)

- `make dev`, `make appimage`, `make deb`, `make linux`
- `make cross-prep-win`, `make win-exe`, `make win-nsis`
- `make release-tag VERSION=vX.Y.Z`, `make release-gh VERSION=vX.Y.Z NOTES="..."`

## Branches & Commits

- Branches: `feat/<sujet-court>`, `fix/<bug-id>`, `chore/<tache>`.
- Messages: en anglais, au présent, style Conventional Commits. Types autorisés: `feat`, `fix`, `docs`, `build`, `ci`, `chore`, `refactor`, `perf`, `test`, `style`, `revert`. Exemple: `fix: announce token test via aria-live`.
- Liez l’issue si possible: `Closes #<num>`.

Exemples:

- `feat: add region filter to expert mode`
- `fix: announce token test result via aria-live`

## Pull Requests

- Décrivez le but et le contexte (issue liée, motivation).
- Ajoutez étapes de test locales (commandes exactes) et captures d’écran si UI.
- Accessibilité (obligatoire):
  - Navigation au clavier OK (Tab/Shift+Tab), focus visible.
  - Annonces `aria-live` intactes, labels associés. Le test du jeton doit déclencher une annonce (role=status/alert).
  - Test rapide avec Orca (Linux) ou NVDA (Windows) si modifs UI.
- Vérifications: build passe, aucun avertissement critique.

Checklist PR rapide:

- But clair et issue liée si possible.
- Commandes de test listées et passantes.
- A11y vérifiée (clavier, annonces, labels).
- Lint/format exécutés; pas d’`any` non justifié.
- Changements limités au scope annoncé.

## Style & Qualité

- TypeScript strict; pas d’`any` non justifié. Composants en PascalCase.
- Rust: `cargo fmt`. Pas d’API Tauri supplémentaire sans justification (sécurité).
- Tests (si ajoutés): placez-les sous `src/__tests__/` et ciblez d’abord `lib/`.
- Lint/format: `npm run lint` (ou `make lint`) et `npm run fmt` (ou `make fmt`) avant toute PR.
- Rust lint: exécutez `make clippy` (ou `cargo clippy -- -D warnings`) et corrigez les avertissements.

Tests:

- Si vous ajoutez des tests, placez‑les sous `src/__tests__/`.
- Ciblez d’abord la logique (`lib/score.ts`, filtrage API), puis ajoutez des tests DOM avec `@axe-core/react`.

## Sécurité & Confidentialité

- Ne commitez jamais de secrets. Pas de télémétrie par défaut.
- Jeton Instances.social: utilisez le trousseau (keyring) pour le stockage persistant. Ne logguez pas le jeton; en cas d’échec API, affichez une erreur (pas de données fictives).
- Réseau: uniquement `instances.social` (proxy optionnel, jamais par défaut).

## Mode Expert

- Le filtre Région est visible uniquement en “Mode expert” et noté “(expérimental)”. Ne forcez pas ce filtre en dehors de ce mode.

## Communication

- Français ou anglais bienvenus. Restez concis et orienté action.

## Hooks Git (validation locale)

- Hook local recommandé: activez les hooks du dépôt: `git config core.hooksPath .githooks`.
- `commit-msg`: (1) ASCII uniquement (anglais), (2) style Conventional Commits minimal.
- `pre-push`: exécute `make check` (lint JS/TS + Clippy). Si ça échoue, corrigez et relancez.
- Bypass temporaire possible (`git commit -n`), mais la CI refusera une PR non conforme.

## Intégration Continue

- GitHub Actions: `.github/workflows/build.yml` exécute d’abord un job `checks` (ESLint, TypeScript `--noEmit`, Prettier `--check`, Clippy, rustfmt `--check`). Les builds Linux (AppImage + Debian) et Windows (NSIS) ne s’exécutent que si ces checks passent.
- Release: `.github/workflows/release.yml` joint les artefacts aux tags `v*`. Utilisez `release-draft.yml` pour un lancement manuel.

## Versionnage & Release

- Versionnage: SemVer (vX.Y.Z). Bumps manuels via `make release-tag VERSION=vX.Y.Z`.
- Notes: fournissez des notes concises; les artefacts (AppImage/NSIS) sont joints par la CI.
