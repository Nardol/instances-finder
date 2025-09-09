#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod api;

use api::{
    clear_instances_cache, clear_token, fetch_instances, fetch_languages, save_token, test_token,
    token_status, AppState,
};
use tauri::{menu::{Menu, MenuItem, Submenu}, Emitter, Manager};

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            token_status,
            save_token,
            clear_token,
            test_token,
            fetch_instances,
            fetch_languages,
            clear_instances_cache
        ])
        .menu(|app| {
            // Build a minimal cross-platform menu (Tauri 2 API)
            let menu = Menu::new(app)?;

            let preferences = MenuItem::with_id(
                app,
                "preferences",
                "Préférences…",
                true,
                if cfg!(target_os = "macos") { Some("Cmd+,") } else { Some("Ctrl+,") },
            )?;
            let refresh = MenuItem::with_id(
                app,
                "refresh",
                "Actualiser",
                true,
                if cfg!(target_os = "macos") { Some("Cmd+R") } else { Some("Ctrl+R") },
            )?;

            let file = Submenu::new(app, "Fichier", true)?;
            file.append(&preferences)?;
            // A simple Quit item (without platform-specific predefined helpers)
            let quit = MenuItem::with_id::<_, _, _, &str>(app, "quit", "Quitter", true, None)?;
            file.append(&quit)?;
            menu.append(&file)?;

            let view = Submenu::new(app, "Affichage", true)?;
            view.append(&refresh)?;
            menu.append(&view)?;

            Ok(menu)
        })
        .on_menu_event(|app, event| {
            let id = event.id.as_ref();
            match id {
                "preferences" => {
                    for w in app.webview_windows().values() {
                        let _ = w.emit("menu://preferences", serde_json::json!({}));
                    }
                }
                "refresh" => {
                    for w in app.webview_windows().values() {
                        let _ = w.emit("menu://refresh", serde_json::json!({}));
                    }
                }
                "quit" => {
                    // Graceful app exit
                    app.exit(0);
                }
                _ => {}
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
