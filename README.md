# Instances Finder

Objectif: aider à choisir une instance Mastodon/Fediverse via l’API `instances.social`, avec une interface accessible (lecteurs d’écran) et des actions rapides (copier l’URL, ouvrir dans le navigateur).

Statut: prototype fonctionnel et accessible. Intégration de l’API `instances.social` (jeton requis). Packaging AppImage opérationnel; cross‑build Windows disponible.

Sommaire

- Aperçu des fonctionnalités
- Prérequis et installation rapide
- Utilisation
- Builds bureau (Linux/Windows)
- Accessibilité
- Dépannage
- Contribuer
- Releases

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
- Tauri CLI

Installation (développement):

1) Installer les dépendances ci‑dessus.
2) Dans ce dossier: `npm install`
3) Démarrer en dev: `npm run tauri:dev` (ouvre la fenêtre applicative avec Vite).

## Utilisation

1) Au premier lancement, ouvrez la page de création de jeton Instances.social, collez le jeton, puis lancez le test.
2) Choisissez vos préférences (langue, taille, modération…).
3) Parcourez les résultats, copiez l’URL de l’instance ou ouvrez‑la dans le navigateur.
4) Optionnel: activez le “Mode expert” pour afficher le filtre Région (expérimental).

Stockage du jeton:

- Par défaut, dans le trousseau système (Linux: Secret Service/libsecret via keyring; Windows: Credential Manager).
- Vous pouvez refuser la mémorisation et garder le jeton uniquement en mémoire.

Confidentialité: le jeton reste local et n’est envoyé qu’à `instances.social`.

## Builds bureau

Build AppImage (Linux):

1) `npm run build` (build frontend)
2) `npm run tauri:build:appimage`
   → sortie: `src-tauri/target/release/bundle/appimage/`

Paquet Debian (.deb):

- Build: `npm run tauri:build:deb`
- Fichier: `src-tauri/target/release/bundle/deb/*.deb`
- Installation: `sudo apt install ./<fichier>.deb`
  - Dépendances runtime: WebKitGTK, GTK, Ayatana AppIndicator, librsvg, libssl (prises en charge via le paquet). Compatible Debian 12 (webkit 4.0) et systèmes avec 4.1.

Build Windows depuis Linux (cross‑build):

- Prérequis (Debian/Ubuntu):
  - `sudo apt update && sudo apt install -y mingw-w64 gcc-mingw-w64-x86-64 g++-mingw-w64-x86-64 binutils-mingw-w64-x86-64 nsis`
  - Optionnel: si votre préfixe diffère, exportez `MINGW_PREFIX` (ex.: `MINGW_PREFIX=x86_64-w64-mingw32`).
- Préparer la cible Rust (auto si manquante): `npm run cross:prep:win`
- `.exe` portable (automatisé): `npm run cross:build:win:exe`
  - Sortie: `src-tauri/target/x86_64-pc-windows-gnu/release/bundle/app/Instances Finder.exe`
- Installeur NSIS: `npm run cross:build:win:nsis`
  - Sortie: `src-tauri/target/x86_64-pc-windows-gnu/release/bundle/nsis/Instances-Finder_x64-setup.exe`
- Notes: WebView2 est téléchargé via bootstrapper; binaires non signés (alerte SmartScreen possible).

Icône de l’application:

- Un PNG minimal est auto‑généré si `src-tauri/icons/icon.png` est absent (pour éviter l’erreur Tauri).
- Pour un meilleur rendu: remplacez‑le par votre propre `src-tauri/icons/icon.png` (recommandé: PNG 512×512).

## Accessibilité

- Clavier: Tab/Shift+Tab, focus toujours visible.
- Annonces: statut (polite) et erreurs (assertive) via `aria-live`.
- Toute régression a11y bloque une PR.

## Dépannage

- Erreur WebKitGTK manquant: installez `libwebkit2gtk-4.0-dev` (ou `-4.1-dev` selon votre distribution) ainsi que les dépendances listées plus haut.
- Échec de stockage du jeton (keyring): choisissez l’option “ne pas mémoriser” pour garder le jeton en mémoire.
- Windows: installeur NSIS non signé → SmartScreen peut afficher un avertissement.
- Node ou Rust non trouvés: vérifiez vos versions (Node 18+, Rust stable) et votre `PATH`.

## Contribuer

- Lisez le guide: [CONTRIBUTING.md](./CONTRIBUTING.md)

## Releases

- Via tags (CI): `npm run release:tag -- v0.1.0` (crée un tag et déclenche le workflow de release qui attache l’AppImage et l’installeur NSIS).
- Via GitHub CLI (brouillon): `npm run release:gh -- v0.1.0 "Notes de version"` (crée une release brouillon; le workflow “release” y attache les artefacts).
