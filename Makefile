# Makefile shortcuts for Instances Finder

NPM := npm

.PHONY: help help-all check dev build appimage deb linux build-linux cross-prep-win win-exe win-nsis clean release-tag release-gh fmt fmt-js fmt-rust lint lint-fix clippy clippy-install

help:
	@echo "Cibles Make disponibles :"
	@echo "  dev            - Lancer l'app en dev (Vite + Tauri)"
	@echo "  build          - Builder le frontend (Vite)"
	@echo "  appimage       - Construire une AppImage Linux"
	@echo "  deb            - Construire un paquet Debian (.deb)"
	@echo "  linux          - Construire AppImage + .deb"
	@echo "  build-linux    - Alias de 'linux' (bundle Linux)"
	@echo "  cross-prep-win - Préparer la cible Rust Windows (cross-build)"
	@echo "  win-exe        - Cross-build Windows (.exe portable)"
	@echo "  win-nsis       - Cross-build Windows (installeur NSIS)"
	@echo "  release-tag    - Créer et pousser un tag VERSION=vX.Y.Z"
	@echo "  release-gh     - Créer une release GitHub brouillon VERSION=vX.Y.Z NOTES=..."
	@echo "  fmt            - Formater JS/TS et Rust"
	@echo "  lint           - Linter JS/TS"
	@echo "  lint-fix       - Linter JS/TS (auto-fix)"
	@echo "  clippy         - Lancer Rust Clippy (lint)"
	@echo "  clippy-install - Installer Clippy si nécessaire"
	@echo "  clean          - Supprimer les artefacts de build"

help-all: help
	@echo
	@echo "Scripts npm utiles :"
	@echo "  dev                 - Vite dev server (web)"
	@echo "  preview             - Vite preview (web)"
	@echo "  tauri:dev           - Tauri dev (desktop)"
	@echo "  build               - Build web (tsc + vite)"
	@echo "  tauri:build         - Build desktop (toutes cibles par défaut)"
	@echo "  tauri:build:appimage- Build AppImage Linux"
	@echo "  tauri:build:deb     - Build paquet Debian"
	@echo "  tauri:build:linux   - Build AppImage + Debian"
	@echo "  cross:prep:win      - Ajouter la cible Rust Windows"
	@echo "  cross:build:win:exe - Cross-build Windows (.exe)"
	@echo "  cross:build:win:nsis- Cross-build Windows (NSIS)"
	@echo "  release:tag         - Créer et pousser un tag"
	@echo "  release:gh          - Créer une release GitHub (brouillon)"
	@echo "  lint, lint:fix      - ESLint (JS/TS)"
	@echo "  fmt, fmt:js, fmt:rust - Formatage"

dev:
	$(NPM) run tauri:dev

build:
	$(NPM) run build

appimage:
	$(NPM) run tauri:build:appimage

deb:
	$(NPM) run tauri:build:deb

linux:
	$(NPM) run tauri:build:linux

build-linux: linux

cross-prep-win:
	$(NPM) run cross:prep:win

win-exe:
	$(NPM) run cross:build:win:exe

win-nsis:
	$(NPM) run cross:build:win:nsis

# Usage: make release-tag VERSION=v0.1.0
release-tag:
	@if [ -z "$$VERSION" ]; then echo "Set VERSION=vX.Y.Z"; exit 1; fi
	$(NPM) run release:tag -- $$VERSION

# Usage: make release-gh VERSION=v0.1.0 NOTES="..."
release-gh:
	@if [ -z "$$VERSION" ]; then echo "Set VERSION=vX.Y.Z"; exit 1; fi
	$(NPM) run release:gh -- $$VERSION "$$NOTES"

clean:
	rm -rf dist src-tauri/target

fmt: fmt-js fmt-rust

fmt-js:
	$(NPM) run fmt:js

fmt-rust:
	$(NPM) run fmt:rust

lint:
	$(NPM) run lint

lint-fix:
	$(NPM) run lint:fix

clippy-install:
	rustup component list --installed | grep -q "^clippy" || rustup component add clippy

clippy: clippy-install
	cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings

# Vérifications rapides avant PR (lint JS/TS + Clippy Rust)
check: lint clippy
	@echo "✓ check: lint JS/TS + Clippy OK"
