# Makefile shortcuts for Instances Finder

NPM := npm

.PHONY: help dev build appimage deb linux cross-prep-win win-exe win-nsis clean release-tag release-gh

help:
	@echo "Targets:"
	@echo "  dev            - Run Tauri dev (Vite + app)"
	@echo "  build          - Build frontend (Vite)"
	@echo "  appimage       - Build Linux AppImage"
	@echo "  deb            - Build Debian .deb"
	@echo "  linux          - Build AppImage + .deb"
	@echo "  cross-prep-win - Add Rust target for Windows cross-build"
	@echo "  win-exe        - Cross-build Windows portable .exe"
	@echo "  win-nsis       - Cross-build Windows NSIS installer"
	@echo "  release-tag    - Create and push git tag VERSION=vX.Y.Z"
	@echo "  release-gh     - Create draft GitHub release VERSION=vX.Y.Z NOTES=..."
	@echo "  clean          - Remove build artifacts"

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

