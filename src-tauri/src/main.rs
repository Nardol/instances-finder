#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod api;

use api::{
    clear_instances_cache, clear_token, fetch_instances, fetch_languages, save_token, test_token,
    token_status, AppState,
};
use tauri::Manager;

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
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
