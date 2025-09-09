# Makefile shortcuts for Instances Finder

NPM := npm

.PHONY: help help-all check check-js check-rust check-js-type check-js-fmt check-rust-fmt ci-checks fix dev build appimage deb linux build-linux cross-prep-win win-exe win-nsis win-zip clean release-tag release-gh fmt fmt-js fmt-rust lint lint-fix clippy clippy-install ensure-cli

help:
	@echo "Cibles Make disponibles :"
	@echo "  dev            - Lancer l'app en dev (Vite + Tauri)"
	@echo "  build          - Builder le frontend (Vite)"
	@echo "  ensure-cli     - Installer les devDeps si besoin (incl. Tauri CLI)"
	@echo "  appimage       - Construire une AppImage Linux"
	@echo "  deb            - Construire un paquet Debian (.deb)"
	@echo "  linux          - Construire AppImage + .deb"
	@echo "  build-linux    - Alias de 'linux' (bundle Linux)"
	@echo "  cross-prep-win - Préparer la cible Rust Windows (cross-build)"
	@echo "  win-exe        - Cross-build Windows (.exe portable)"
	@echo "  win-nsis       - Cross-build Windows (installeur NSIS)"
	@echo "  win-zip        - Créer une archive .zip portable Windows (mac/Linux)"
	@echo "  release-tag    - Créer et pousser un tag VERSION=vX.Y.Z"
	@echo "  release-gh     - Créer une release GitHub brouillon VERSION=vX.Y.Z NOTES=..."
	@echo "  fmt            - Formater JS/TS et Rust"
	@echo "  lint           - Linter JS/TS"
	@echo "  lint-fix       - Linter JS/TS (auto-fix)"
	@echo "  clippy         - Lancer Rust Clippy (lint)"
	@echo "  clippy-install - Installer Clippy si nécessaire"
	@echo "  check          - Lancer lint JS/TS + Clippy"
	@echo "  check-js       - Lancer lint JS/TS uniquement"
	@echo "  check-js-type  - Vérifier les types TypeScript (tsc --noEmit)"
	@echo "  check-js-fmt   - Vérifier le formatage Prettier"
	@echo "  check-rust     - Lancer Clippy"
	@echo "  check-rust-fmt - Vérifier formatage Rust (cargo fmt --check)"
	@echo "  ci-checks      - Réplique locale des checks CI (lint+types+format JS/Rust)"
	@echo "  fix            - Formatter et corriger (fmt + lint-fix)"
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

dev: ensure-cli
	$(NPM) run tauri:dev

build:
	$(NPM) run build

appimage: ensure-cli
	$(NPM) run tauri:build:appimage

deb: ensure-cli
	$(NPM) run tauri:build:deb

linux: ensure-cli
	$(NPM) run tauri:build:linux

build-linux: linux

cross-prep-win:
	$(NPM) run cross:prep:win

win-exe: ensure-cli
	$(NPM) run cross:build:win:exe

win-nsis: ensure-cli
	$(NPM) run cross:build:win:nsis

win-zip: ensure-cli
	$(NPM) run cross:build:win:zip

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

# Vérifications rapides avant PR (checks ciblés)
check-js:
	$(NPM) run lint

check-rust: clippy

check: check-js check-rust
	@echo "✓ check: lint JS/TS + Clippy OK"

check-js-type:
	npx --no-install tsc --noEmit

check-js-fmt:
	npx --no-install prettier --check .

check-rust-fmt:
	cargo fmt --manifest-path src-tauri/Cargo.toml -- --check

ci-checks: check-js check-js-type check-js-fmt clippy check-rust-fmt
	@echo "✓ ci-checks: ESLint + tsc --noEmit + Prettier --check + Clippy + rustfmt --check OK"

fix:
	$(NPM) run fmt && $(NPM) run lint:fix

# Assure que la CLI Tauri locale est disponible (sans installer en global)
ensure-cli:
	@# Si la CLI locale manque, installe les devDependencies (incluant @tauri-apps/cli)
	@if [ ! -x node_modules/.bin/tauri ]; then \
		echo "[ensure-cli] Installing devDependencies (incl. @tauri-apps/cli)…"; \
		NPM_CONFIG_PRODUCTION=false $(NPM) ci || NPM_CONFIG_PRODUCTION=false $(NPM) install; \
	else \
		echo "[ensure-cli] ✓ Tauri CLI present (node_modules/.bin/tauri)"; \
	fi
	@# Vérification rapide (la CLI Tauri exige un sous-commande; on utilise --help)
	@node_modules/.bin/tauri --help >/dev/null 2>&1 || { echo "[ensure-cli] ✗ Tauri CLI not available"; exit 1; }
