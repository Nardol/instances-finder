# Instances Finder

Objectif: aider à choisir une instance Mastodon/Fediverse via l’API `instances.social`, avec une interface accessible (lecteurs d’écran) et des actions rapides (copier l’URL, ouvrir dans le navigateur).

Statut: prototype fonctionnel et accessible. Intégration de l’API `instances.social` (jeton requis). Packaging AppImage opérationnel; cross-build Windows disponible.

Sommaire

- Aperçu des fonctionnalités
- Prérequis et installation rapide
- Utilisation
- Builds bureau (Linux/Windows)
- Accessibilité
- Dépannage
- Contribuer
- Releases
- Transparence IA

## Aperçu des fonctionnalités

- Assistant de préférences (langue, taille, modération, inscriptions, contenu sensible).
- Mode expert: filtre Région (expérimental, basé sur le TLD); pondérations à venir.
- Accessibilité: navigation clavier complète, annonces `role=status/alert`, lien d’évitement, contraste suffisant.
- I18n: FR par défaut, EN disponible.

## Prérequis et installation rapide

Arborescence minimale:

- `src/` UI React/TypeScript (Vite)
- `src-tauri/` hôte Tauri (Rust)

Système (Debian 12 Bookworm):

```
sudo apt update && sudo apt install -y \
  libwebkit2gtk-4.0-dev libgtk-3-dev libayatana-appindicator3-dev \
  librsvg2-dev libsoup2.4-dev libjavascriptcoregtk-4.0-dev \
  curl build-essential pkg-config
```

Note: si `libwebkit2gtk-4.1-dev` est disponible, vous pouvez l’installer à la place de `libwebkit2gtk-4.0-dev`.

Outils:

- Node.js 18+ et npm
- Rust (stable) et `cargo`
- Tauri CLI (installée localement via devDependency)

Important: aucune installation globale de `tauri` n’est requise. La CLI est fournie par `@tauri-apps/cli` (devDependency) et sera disponible dans les scripts npm après l’installation (`node_modules/.bin/tauri`).

Installation (développement):

1. Installer les dépendances système et outils ci-dessus.
2. Installer les dépendances du projet: `npm ci` (ou `npm install`).
   - Option tout-en-un (recommandée): `make setup` → exécute `npm ci` et précompile `xtask` en release pour des commandes plus rapides.
   - Assurez-vous d’installer les devDependencies (ne pas installer en mode production). Si vous avez `NODE_ENV=production` ou `npm config set production true`, réactivez les devDependencies avec `npm config set production false` puis relancez `npm ci`.
3. Vérifier la CLI si besoin: `npx --no-install @tauri-apps/cli -v` (devrait afficher la version locale).
4. Démarrer en dev (du plus simple au plus rapide):
   - Simple: `make dev` (alias qui appelle xtask)
   - Direct: `cargo run --manifest-path xtask/Cargo.toml -- dev`
   - Ultra-rapide sessions longues: `make xtask-release` (précompile xtask) puis `make dev`
   - Legacy (sans xtask): `npm run tauri:dev`

## Utilisation

1. Au premier lancement, ouvrez la page de création de jeton Instances.social, collez le jeton, puis lancez le test.
2. Choisissez vos préférences (langue, taille, modération…).
3. Parcourez les résultats, copiez l’URL de l’instance ou ouvrez-la dans le navigateur.
4. Optionnel: activez le “Mode expert” pour afficher le filtre Région (expérimental).

Stockage du jeton:

- Par défaut, dans le trousseau système (Linux: Secret Service/libsecret via keyring; Windows: Credential Manager).
- Vous pouvez refuser la mémorisation et garder le jeton uniquement en mémoire.

Confidentialité: le jeton reste local et n’est envoyé qu’à `instances.social`.

## Builds bureau

Build AppImage (Linux):

1. `npm run build` (build frontend)
2. `npm run tauri:build:appimage`
   → sortie: `src-tauri/target/release/bundle/appimage/`

Paquet Debian (.deb):

- Build: `npm run tauri:build:deb`
- Fichier: `src-tauri/target/release/bundle/deb/*.deb`
- Installation: `sudo apt install ./<fichier>.deb`
  - Dépendances runtime: WebKitGTK, GTK, Ayatana AppIndicator, librsvg, libssl (prises en charge via le paquet). Compatible Debian 12 (webkit 4.0) et systèmes avec 4.1.

Build Windows depuis Linux (cross-build):

- Prérequis (Debian/Ubuntu):
  - `sudo apt update && sudo apt install -y mingw-w64 gcc-mingw-w64-x86-64 g++-mingw-w64-x86-64 binutils-mingw-w64-x86-64 nsis`
  - Optionnel: si votre préfixe diffère, exportez `MINGW_PREFIX` (ex.: `MINGW_PREFIX=x86_64-w64-mingw32`).
- Préparer la cible Rust (auto si manquante): `npm run cross:prep:win`
- `.exe` portable (automatisé): `npm run cross:build:win:exe`
  - Sortie: `src-tauri/target/x86_64-pc-windows-gnu/release/bundle/app/Instances Finder.exe`
- Installeur NSIS: `npm run cross:build:win:nsis`
  - Sortie: `src-tauri/target/x86_64-pc-windows-gnu/release/bundle/nsis/Instances-Finder_x64-setup.exe`
- Notes: WebView2 est téléchargé via bootstrapper; binaires non signés (alerte SmartScreen possible).

Build Windows depuis macOS (portable .zip):

- Prérequis (macOS):
  - Installer le toolchain MinGW: `brew install mingw-w64`
  - Préparer la cible Rust: `npm run cross:prep:win`
- Créer une archive portable: `npm run cross:build:win:zip`
  - Sortie: `src-tauri/target/x86_64-pc-windows-gnu/release/bundle/<Nom>_win-x64_portable_v<version>.zip`
  - Contenu: exécutable Windows + DLLs nécessaires (pas d’installation).
  - Notes: le runtime WebView2 est téléchargé via bootstrapper au premier lancement.

### Bundler Windows et fallback

- Ce que fait Tauri (par défaut):
  - Compile l’exécutable: `src-tauri/target/x86_64-pc-windows-gnu/release/Instances Finder.exe`.
  - Bundles Windows:
    - `app` (portable): `.../bundle/app/Instances Finder.exe` (+ DLLs nécessaires).
    - `nsis` (installateur): `.../bundle/nsis/Instances-Finder_x64-setup.exe`.
- Ce que fait notre script `scripts/cross-win-build.sh` en plus:
  - Génère `src-tauri/icons/icon.ico` si manquant via `tauri icon`.
  - Force `--bundles <app|nsis>` côté CLI.
  - Fallback: si le bundler ne crée pas `bundle/` (certains environnements cross), crée `.../bundle/app/` et y copie l’`.exe` et `WebView2Loader.dll` pour un portable minimal.
- À retenir:
  - Le bundling `app`/`nsis` est fourni par Tauri; le “fallback portable” est une aide locale du script.
  - L’installateur NSIS ne dispose pas de fallback (il dépend du bundler Tauri et de `nsis`).

Icône de l’application:

- Un PNG minimal est auto-généré si `src-tauri/icons/icon.png` est absent (pour éviter l’erreur Tauri).
- Le build Windows a besoin d’un `.ico`. Le script de cross-build génère automatiquement `src-tauri/icons/icon.ico` à partir du PNG via `tauri icon` si le fichier n’existe pas.
- Pour un meilleur rendu: fournissez votre propre `src-tauri/icons/icon.png` (512×512 conseillé) et, optionnellement, un `src-tauri/icons/icon.ico` dédié. À défaut, l’ICO sera régénéré depuis le PNG.

## Accessibilité

Cette application vise une excellente accessibilité clavier et lecteur d’écran (notamment Orca/WebKitGTK).

- Résultats: vraie liste (`role=list`/`listitem`) avec navigation type bureau (Flèches/Haut/Bas, Home/End, PageUp/PageDown). Les actions restent masquées pendant la navigation aux flèches et apparaissent au Tab.
- Annonces: une seule région live polie globale (`role=status`) pour les statuts; erreurs en `role=alert` placé près du titre des résultats.
- Préférences: vrai dialogue modal (`role=dialog` + `aria-modal`), piège de focus robuste, fond mis en état `inert`.
- Langues: sélection multi via `role=listbox` + `aria-activedescendant` pour conserver le mode focus d’Orca; l’état “sélectionnée/non sélectionnée” est intégré au nom accessible.
- Option expérimentale: “Rafraîchir la plage braille lors du changement d’état” (désactivée par défaut). Active un léger contournement pour pousser la mise à jour braille au toggle; compromis possible: double annonce vocale selon configuration Orca.

Limites / compromis:

- En mode listbox (focus sur le conteneur), la plage braille peut ne pas toujours refléter immédiatement un toggle si l’option expérimentale est désactivée; en contrepartie, Orca reste en mode focus et ne bascule pas en navigation.
- Éviter les annonces live lors des toggles de sélection, sinon certains lecteurs basculent en mode navigation.

## Dépannage

- Erreur WebKitGTK manquant: installez `libwebkit2gtk-4.0-dev` (ou `-4.1-dev` selon votre distribution) ainsi que les dépendances listées plus haut.
- Échec de stockage du jeton (keyring): choisissez l’option “ne pas mémoriser” pour garder le jeton en mémoire.
- Windows: installeur NSIS non signé → SmartScreen peut afficher un avertissement.
- Node ou Rust non trouvés: vérifiez vos versions (Node 18+, Rust stable) et votre `PATH`.
- `sh: 1: tauri: not found` lors d’un `npm run tauri:*`:
  - Exécutez d’abord `npm ci` (ou `npm install`) pour installer les devDependencies, dont `@tauri-apps/cli`.
  - Vérifiez que vous n’êtes pas en mode production: `npm config get production` doit être `false`.
  - Option de vérification: `npx --no-install @tauri-apps/cli -v` doit afficher la version locale.
  - Après un grand ménage (`make clean-all`), lancez `make setup` pour réinstaller les dépendances et re-précompiler `xtask`.

### Diagnostic rapide (doctor)

- Lancez `make doctor` (ou `cargo run --manifest-path xtask/Cargo.toml -- doctor`) pour vérifier l’environnement de développement:
  - Node/npm (Node ≥ 18), Rust/cargo, présence de `clippy` et `rustfmt`.
  - CLI Tauri locale (via `node_modules/.bin/tauri`).
  - Dépendances Linux (WebKitGTK/GTK et associés) via `pkg-config` et, sur Debian/Ubuntu, `dpkg`.
- Le script affiche OK/WARN/FAIL et retourne un code d’erreur si un FAIL est détecté.
- En cas de CLI Tauri manquante, exécutez `make ensure-cli` puis relancez `make doctor`.

## Contribuer

- Lisez le guide: [CONTRIBUTING.md](./CONTRIBUTING.md)

### Performances & transparence

- Make est l’interface principale et reste recommandée. Pour des sessions longues, lancez d’abord `make xtask-release`: Make détecte alors automatiquement le binaire xtask précompilé et l’utilise, ce qui réduit la latence des commandes (`dev`, `build`, `ci-checks`, etc.).
- L’overhead de Make est négligeable; l’essentiel du temps est passé dans Vite/Tauri/Clippy. Utiliser Make ne “gâche” donc pas les perfs.

## Releases

- Via tags (CI): `npm run release:tag -- v0.1.0` (crée un tag et déclenche le workflow de release qui attache l’AppImage et l’installeur NSIS).
- Via GitHub CLI (brouillon): `npm run release:gh -- v0.1.0 "Notes de version"` (crée une release brouillon; le workflow “release” y attache les artefacts).

### Makefile (raccourcis)

- Lister: `make help` (cibles Make) ou `make help-all` (inclut scripts npm)
- Dev: `make dev` | Build frontend: `make build`
- Linux: `make appimage` | `make deb` | `make linux` ou `make build-linux`
- Vérification rapide: `make check` (lint JS/TS + Clippy)
- Vérifs ciblées: `make check-js` ou `make check-rust`
- Types/formatage:
  - `make check-js-type` (TypeScript `tsc --noEmit`)
  - `make check-js-fmt` (Prettier `--check`)
  - `make check-rust-fmt` (`cargo fmt --check`)
- CI locale: `make ci-checks` (réplique des checks CI)
- Corrections automatiques: `make fix` (formatage + lint --fix)
- Formatage/Lint: `make fmt`, `make lint`, `make lint-fix`
- Setup complet: `make setup` (installe les deps via `npm ci` et précompile `xtask` en release)
- Nettoyage: `make clean` (rapide), `make clean-xtask` (supprime le binaire `xtask`), `make clean-deps` (supprime `node_modules`), `make clean-all` (tout nettoyer)

## Transparence IA

Ce dépôt a été intégralement rédigé par un assistant IA (OpenAI, via Codex CLI), sur la base d’instructions fonctionnelles et de tests manuels effectués par l’auteur humain. À ce stade, il n’y a pas encore eu de relecture de code humaine systématique.

Implications et bonnes pratiques:

- Revue recommandée: merci de privilégier des revues axées accessibilité, sécurité (Tauri/IPC/clé API), gestion des erreurs, et performances.
- Responsabilité: les décisions d’architecture ont été prises par l’assistant IA; l’auteur humain a validé le comportement fonctionnel. N’hésitez pas à ouvrir des issues pour toute ambiguïté ou amélioration.
- Licence: le code reste publié sous la licence indiquée dans `LICENSE` (MIT). Les contributions restent sous la même licence.

EN (summary): This repository was generated by an AI assistant (OpenAI via Codex CLI) based on human functional guidance and manual testing. No full human code review has occurred yet. Reviews focused on a11y, security, error handling, and performance are welcome.
