Instances Finder
================

But: Trouver une instance Mastodon/Fediverse via l'API instances.social, avec une UI accessible (lecteurs d'écran) et des actions rapides (copier l'URL, ouvrir le navigateur).

Statut: Prototype accessible, API instances.social intégrée (jeton requis). Packaging AppImage opérationnel; cross‑build Windows disponible.

Fonctionnalités
- Assistant de préférences (langue, taille, modération, inscriptions, contenu sensible).
- Mode expert: filtre Région (expérimental, basé TLD) et pondérations à venir.
- Accessibilité: navigation clavier complète, annonces `role=status/alert`, lien d’évitement, contraste suffisant.
- I18n: FR par défaut, EN disponible.

Arborescence
- `src/` UI React/TypeScript (Vite)
- `src-tauri/` hôte Tauri (Rust)

Prérequis (Debian 12 Bookworm)
- Système (développement Tauri):
  
  `sudo apt update && sudo apt install -y libwebkit2gtk-4.0-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev libsoup2.4-dev libjavascriptcoregtk-4.0-dev curl build-essential pkg-config`
  
  Note: si `libwebkit2gtk-4.1-dev` est disponible sur votre système, vous pouvez l’installer à la place de `libwebkit2gtk-4.0-dev`.
- Node.js 18+ et npm, Rust (stable) et `cargo`, Tauri CLI.

Installation (dev)
1) Installer dépendances ci-dessus.
2) Dans ce dossier: `npm install`
3) Dev: `npm run tauri:dev` (ouvre la fenêtre appli avec Vite en dev).

Build AppImage (Linux)
1) `npm run build` (build frontend)
2) `npm run tauri:build:appimage`
   L'AppImage sera générée dans `src-tauri/target/release/bundle/appimage/`.

Notes accessibilité
- Testé au clavier: Tab/Shift+Tab, focus visible renforcé.
- Annonces: statut (polite) et erreurs (assertive) vocalisées par Orca.

Limitations actuelles
- Filtre Région heuristique (TLD), désactivé hors mode expert.
- Pondérations de score: à venir.

Licences et télémétrie
- Aucune télémétrie. Pas de collecte de données personnelles.

Contribuer
- Consultez le guide de contribution: [CONTRIBUTING.md](./CONTRIBUTING.md) 
- Pour les règles détaillées (structure, style, accessibilité, PR): [AGENTS.md](./AGENTS.md)

Icône de l’application
- Un pictogramme PNG minimal est auto‑généré au build si `src-tauri/icons/icon.png` est absent (pour éviter l’erreur Tauri).
- Pour un meilleur rendu, remplacez‑le par votre propre `src-tauri/icons/icon.png` (recommandé: PNG 512×512).

Jeton Instances.social (API)
- L’application peut interroger l’API `instances.social` pour des résultats complets.
- Au premier lancement, un écran “Connexion à Instances.social” propose d’ouvrir la page de création de jeton, de coller le jeton et de le tester.
- Stockage: par défaut dans le trousseau système (Linux: Secret Service/libsecret via keyring; Windows: Credential Manager). Vous pouvez choisir de ne pas mémoriser et de garder le jeton en mémoire.
- Confidentialité: le jeton ne quitte jamais votre machine et n’est envoyé qu’à `instances.social`.

Build Windows depuis Linux (cross-build)
- Prérequis: `sudo apt install mingw-w64 nsis`.
- Préparer la cible Rust (auto si manquante): `npm run cross:prep:win`
- .exe portable (automatisé): `npm run cross:build:win:exe`
  - Sortie: `src-tauri/target/x86_64-pc-windows-gnu/release/bundle/app/Instances Finder.exe`
- Installeur NSIS (best effort): `npm run cross:build:win:nsis`
  - Sortie: `src-tauri/target/x86_64-pc-windows-gnu/release/bundle/nsis/Instances-Finder_x64-setup.exe`
- Notes: WebView2 sera téléchargé via bootstrapper; binaires non signés (SmartScreen possible).
