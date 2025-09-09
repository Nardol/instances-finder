POC Flutter + Rust (FFI direct, sans WebView)

Objectif
- Créer une petite app Flutter desktop qui appelle une librairie Rust via FFI.
- Accessibilité: rester sur widgets Flutter standards (Semantics, Focus, labels).

Architecture
- Rust `cdylib` (lib dyn): expose des fonctions `extern "C"` simples (ex: `greet`, `sum`).
- Flutter (Dart): charge la lib via `dart:ffi` et mappe les fonctions.

Pré-requis
- Linux/macOS/Windows, Rust stable, Flutter stable (channel stable), C toolchain (clang/gcc), CMake (Linux), Ninja (optionnel), pkg-config.

Étapes (résumé)
1) Compiler la lib Rust – voir `poc/flutter_rust/rustlib/`.
2) Créer l’app Flutter: `flutter create --platforms=linux,windows,macos poc_finder`.
3) Ajouter dépendance Dart: `ffi: ^2.1.0` (pubspec.yaml).
4) Mapper les symboles Rust côté Dart (exemple fourni plus bas).
5) Copier la lib compilée dans le bon emplacement selon l’OS.
6) Lancer: `flutter run -d linux` (ou windows/macos).

Rust: build
```bash
cd poc/flutter_rust/rustlib
cargo build --release
# Linux → target/release/libinstances_core.so
# macOS → target/release/libinstances_core.dylib
# Windows → target/release/instances_core.dll
```

Flutter: mappage FFI (exemple Dart)
```dart
// lib/native.dart
import 'dart:ffi' as ffi;
import 'dart:io' show Platform;

typedef GreetNative = ffi.Pointer<ffi.Utf8> Function(ffi.Pointer<ffi.Utf8>);
typedef GreetDart = ffi.Pointer<ffi.Utf8> Function(ffi.Pointer<ffi.Utf8>);
typedef FreeNative = ffi.Void Function(ffi.Pointer<ffi.Utf8>);
typedef FreeDart = void Function(ffi.Pointer<ffi.Utf8>);

ffi.DynamicLibrary _open() {
  if (Platform.isLinux) return ffi.DynamicLibrary.open('libinstances_core.so');
  if (Platform.isMacOS) return ffi.DynamicLibrary.open('libinstances_core.dylib');
  if (Platform.isWindows) return ffi.DynamicLibrary.open('instances_core.dll');
  throw UnsupportedError('Platform not supported');
}

final _lib = _open();
final GreetDart _greet = _lib.lookupFunction<GreetNative, GreetDart>('greet');
final FreeDart _free = _lib.lookupFunction<FreeNative, FreeDart>('free_rust_cstr');

String greet(String name) {
  final namePtr = name.toNativeUtf8();
  final resPtr = _greet(namePtr);
  calloc.free(namePtr);
  try {
    return resPtr.toDartString();
  } finally {
    _free(resPtr);
  }
}
```

Copie des libs (debug local)
- Linux: placez la `.so` à côté de l’exécutable runner ou dans un répertoire présent dans `LD_LIBRARY_PATH`. En dev, le plus simple est de lancer Flutter avec `LD_LIBRARY_PATH=...`:
```bash
export LD_LIBRARY_PATH="$(pwd)/poc/flutter_rust/rustlib/target/release:${LD_LIBRARY_PATH}"
flutter run -d linux
```
- Windows: copiez `instances_core.dll` dans `build/windows/runner/Debug/` (ou Release) avant de lancer.
- macOS: utilisez `DYLD_LIBRARY_PATH` ou intégrez la dylib dans le bundle app pour un test rapide.

Accessibilité Flutter (rappels)
- Utilisez les widgets standards (Button, ListView, TextField) → rôles et noms accessibles automatiques.
- Ajoutez `Semantics(label: '…')` si nécessaire pour des icônes sans texte.
- Vérifiez navigation clavier (Tab/Shift+Tab) et focus visible.
- Tests écran lecteur: NVDA (Windows), VoiceOver (macOS), Orca (Linux).

Aller plus loin
- `flutter_rust_bridge`: génération automatique de bindings (plus confortable pour des API complexes). Demande un peu plus de tooling.
- Packaging: une fois le POC validé, préparez des scripts de copie des DLL/.so/.dylib par plateforme et intégrez au build Flutter.

