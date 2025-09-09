#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod api;

use api::{
    clear_instances_cache, clear_token, fetch_instances, fetch_languages, save_token, test_token,
    token_status, AppState,
};
use tauri::{AboutMetadata, CustomMenuItem, Menu, MenuItem, Submenu};

fn main() {
    let preferences = CustomMenuItem::new("preferences".to_string(), "Préférences…").accelerator(
        if cfg!(target_os = "macos") {
            "Cmd+,"
        } else {
            "Ctrl+,"
        },
    );
    let quit = MenuItem::Quit;
    let file_menu = Submenu::new(
        "Fichier",
        Menu::new()
            .add_item(preferences.clone())
            .add_native_item(quit),
    );
    let refresh = CustomMenuItem::new("refresh".to_string(), "Actualiser").accelerator(
        if cfg!(target_os = "macos") {
            "Cmd+R"
        } else {
            "Ctrl+R"
        },
    );
    let view_menu = Submenu::new(
        "Affichage",
        Menu::new()
            .add_item(refresh.clone())
            .add_native_item(MenuItem::EnterFullScreen)
            .add_native_item(MenuItem::Minimize)
            .add_native_item(MenuItem::Zoom),
    );
    let help_menu = Submenu::new(
        "Aide",
        Menu::new().add_native_item(MenuItem::About(
            "Instances Finder".to_string(),
            AboutMetadata::default(),
        )),
    );

    let menu = Menu::new()
        .add_submenu(file_menu)
        .add_submenu(view_menu)
        .add_submenu(help_menu);

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
        .menu(menu)
        .on_menu_event(|event| match event.menu_item_id() {
            "preferences" => {
                // Fire a frontend event so the UI can react (open prefs, focus toggle, etc.)
                let _ = event
                    .window()
                    .emit("menu://preferences", serde_json::json!({}));
            }
            "refresh" => {
                let _ = event.window().emit("menu://refresh", serde_json::json!({}));
            }
            _ => {}
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
