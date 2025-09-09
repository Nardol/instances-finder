#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod api;

use api::{clear_token, fetch_instances, save_token, test_token, token_status, AppState};

fn main() {
    tauri::Builder::default()
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            token_status,
            save_token,
            clear_token,
            test_token,
            fetch_instances
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
