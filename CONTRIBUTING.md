# Contributing Guide

Merci de votre intérêt pour ce projet. Cette courte page complète le README et AGENTS.md.

## Start Here
- Lisez le [README](./README.md) pour l’installation et les commandes.
- Suivez les pratiques dans [AGENTS.md](./AGENTS.md) (structure, style, a11y, PRs).

## Development Quickstart
- Dépendances: voir README (paquets system + Node + Rust).
- Installer: `npm install`
- Dev: `npm run tauri:dev`
- Build AppImage: `npm run tauri:build:appimage`
- Build Debian (.deb): `npm run tauri:build:deb`
- Cross‑build Windows (depuis Linux):
  - Prérequis: `sudo apt install -y mingw-w64 gcc-mingw-w64-x86-64 g++-mingw-w64-x86-64 binutils-mingw-w64-x86-64 nsis`
  - Préparer la cible Rust: `npm run cross:prep:win`
  - `.exe`: `npm run cross:build:win:exe`  |  `nsis`: `npm run cross:build:win:nsis`

### Makefile (optionnel)
- `make dev`, `make appimage`, `make deb`, `make linux`
- `make cross-prep-win`, `make win-exe`, `make win-nsis`
- `make release-tag VERSION=vX.Y.Z`, `make release-gh VERSION=vX.Y.Z NOTES="..."`

## Branches & Commits
- Branches: `feat/<sujet-court>`, `fix/<bug-id>`, `chore/<tache>`.
- Messages: au présent + type: `feat:`, `fix:`, `docs:`, `chore:`. Ajoutez `Closes #<num>` si pertinent.

## Pull Requests
- Décrivez le but et le contexte (issue liée, motivation).
- Ajoutez étapes de test locales (commandes exactes) et captures d’écran si UI.
- Accessibilité (obligatoire):
  - Navigation au clavier OK (Tab/Shift+Tab), focus visible.
  - Annonces `aria-live` intactes, labels associés. Le test du jeton doit déclencher une annonce (role=status/alert).
  - Test rapide avec Orca (Linux) ou NVDA (Windows) si modifs UI.
- Vérifications: build passe, aucun avertissement critique.

## Style & Qualité
- TypeScript strict; pas d’`any` non justifié. Composants en PascalCase.
- Rust: `cargo fmt`. Pas d’API Tauri supplémentaire sans justification (sécurité).
- Tests (si ajoutés): placez-les sous `src/__tests__/` et ciblez d’abord `lib/`.

## Sécurité & Confidentialité
- Ne commitez jamais de secrets. Pas de télémétrie par défaut.
- Jeton Instances.social: utilisez le trousseau (keyring) pour le stockage persistant. Ne logguez pas le jeton; en cas d’échec API, affichez une erreur (pas de données fictives).
- Réseau: uniquement `instances.social` (proxy optionnel, jamais par défaut).

## Mode Expert
- Le filtre Région est visible uniquement en “Mode expert” et noté “(expérimental)”. Ne forcez pas ce filtre en dehors de ce mode.

## Communication
- Français ou anglais bienvenus. Restez concis et orienté action.

## Intégration Continue
- GitHub Actions: `.github/workflows/build.yml` build Linux (AppImage) et Windows (NSIS), et publie les artefacts.
