# Makefile shortcuts for Instances Finder

NPM := npm

# Prefer prebuilt xtask binary if available; fallback to cargo run.
XTASK_BIN_POSIX := ./xtask/target/release/xtask
XTASK_BIN_WIN := ./xtask/target/release/xtask.exe
XTASK := $(if $(wildcard $(XTASK_BIN_WIN)),$(XTASK_BIN_WIN),$(if $(wildcard $(XTASK_BIN_POSIX)),$(XTASK_BIN_POSIX),cargo run --manifest-path xtask/Cargo.toml --))
XTASK_BANNER = @if [ -x ./xtask/target/release/xtask ] || [ -x ./xtask/target/release/xtask.exe ]; then echo "[xtask] Using prebuilt binary"; else echo "[xtask] Using cargo run (no prebuilt binary)"; fi

.PHONY: help help-all check check-par check-js check-rust check-js-type check-js-fmt check-rust-fmt ci-checks ci-checks-par bench fix dev build appimage deb linux build-linux cross-prep-win win-exe win-nsis win-zip clean clean-xtask clean-deps clean-all release-tag release-gh fmt fmt-js fmt-rust lint lint-fix clippy clippy-install ensure-cli doctor xtask-release setup

help:
	@echo "Cibles Make disponibles :"
	@echo "  (Astuce perf) Faites \"make xtask-release\" une fois par session longue ;"
	@echo "  Make préférera automatiquement le binaire xtask précompilé."
	@echo "  dev            - Lancer l'app en dev (Vite + Tauri)"
	@echo "  build          - Builder le frontend (Vite)"
	@echo "  ensure-cli     - Installer les devDeps si besoin (incl. Tauri CLI)"
	@echo "  doctor         - Diagnostic de l'environnement dev (Node/Rust/WebKitGTK)"
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
	@echo "  check-par      - Idem mais en parallèle (plus rapide)"
	@echo "  check-js       - Lancer lint JS/TS uniquement"
	@echo "  check-js-type  - Vérifier les types TypeScript (tsc --noEmit)"
	@echo "  check-js-fmt   - Vérifier le formatage Prettier"
	@echo "  check-rust     - Lancer Clippy"
	@echo "  check-rust-fmt - Vérifier formatage Rust (cargo fmt --check)"
	@echo "  ci-checks      - Réplique locale des checks CI (lint+types+format JS/Rust)"
	@echo "  ci-checks-par  - Idem en parallèle (plus rapide)"
	@echo "  bench          - Mesurer seq vs. parallèle (2e run)"
	@echo "  fix            - Formatter et corriger (fmt + lint-fix)"
	@echo "  clean          - Supprimer dist + src-tauri/target (rapide)"
	@echo "  clean-xtask    - Supprimer le binaire xtask précompilé (xtask/target)"
	@echo "  clean-deps     - Supprimer node_modules (re-installation nécessaire)"
	@echo "  clean-all      - clean + clean-xtask + clean-deps"
	@echo "  setup          - npm ci + (option) build xtask --release"

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
	$(XTASK_BANNER)
	$(XTASK) dev

build:
	$(XTASK_BANNER)
	$(XTASK) build web

appimage:
	$(XTASK_BANNER)
	$(XTASK) build appimage

deb:
	$(XTASK_BANNER)
	$(XTASK) build deb

linux:
	$(XTASK_BANNER)
	$(XTASK) build linux

build-linux: linux

cross-prep-win:
	$(XTASK_BANNER)
	$(XTASK) prep win

win-exe:
	$(XTASK_BANNER)
	$(XTASK) build win-exe

win-nsis:
	$(XTASK_BANNER)
	$(XTASK) build win-nsis

win-zip:
	$(XTASK_BANNER)
	$(XTASK) build win-zip

# Usage: make release-tag VERSION=v0.1.0
release-tag:
	@if [ -z "$$VERSION" ]; then echo "Set VERSION=vX.Y.Z"; exit 1; fi
	$(XTASK_BANNER)
	$(XTASK) release tag $$VERSION

# Usage: make release-gh VERSION=v0.1.0 NOTES="..."
release-gh:
	@if [ -z "$$VERSION" ]; then echo "Set VERSION=vX.Y.Z"; exit 1; fi
	$(XTASK_BANNER)
	$(XTASK) release gh $$VERSION --notes "$$NOTES"

clean:
	$(XTASK_BANNER)
	$(XTASK) clean

clean-xtask:
	rm -rf xtask/target

clean-deps:
	rm -rf node_modules

clean-all: clean clean-xtask clean-deps

setup:
	$(XTASK_BANNER)
	$(XTASK) setup --xtask-release

fmt: fmt-js fmt-rust

fmt-js:
	$(XTASK_BANNER)
	$(XTASK) fmt js

fmt-rust:
	$(XTASK_BANNER)
	$(XTASK) fmt rust

lint:
	$(XTASK_BANNER)
	$(XTASK) lint

lint-fix:
	$(XTASK_BANNER)
	$(XTASK) lint --fix

clippy-install:
	rustup component list --installed | grep -q "^clippy" || rustup component add clippy

clippy: clippy-install
	cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings

# Vérifications rapides avant PR (checks ciblés)
check-js:
	$(XTASK_BANNER)
	$(XTASK) lint

check-rust: clippy

check:
	$(XTASK_BANNER)
	$(XTASK) check

check-par:
	$(XTASK_BANNER)
	$(XTASK) check-par

check-js-type:
	$(XTASK_BANNER)
	$(XTASK) ts-check

check-js-fmt:
	$(XTASK_BANNER)
	$(XTASK) fmt-check js

check-rust-fmt:
	$(XTASK_BANNER)
	$(XTASK) fmt-check rust

ci-checks:
	$(XTASK_BANNER)
	$(XTASK) ci-checks

ci-checks-par:
	$(XTASK_BANNER)
	$(XTASK) ci-checks-par

bench:
	@echo "[bench] Recompiling xtask with latest changes…"
	cargo build --manifest-path xtask/Cargo.toml --release
	@echo "[bench] Running benchmark (sequential vs parallel)…"
	./xtask/target/release/xtask bench

fix:
	$(XTASK_BANNER)
	$(XTASK) fix

# Assure que la CLI Tauri locale est disponible (sans installer en global)
ensure-cli:
	$(XTASK_BANNER)
	$(XTASK) ensure-cli

doctor:
	$(XTASK_BANNER)
	$(XTASK) doctor

xtask-release:
	cargo build --manifest-path xtask/Cargo.toml --release
