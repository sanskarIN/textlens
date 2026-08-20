pub mod domain;

mod commands;
mod error;
mod fileio;
mod logging;
mod report;
mod settings_backup;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    logging::init();
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::analyze_text,
            commands::analyze_file,
            commands::export_report,
            commands::import_report,
            commands::export_settings,
            commands::import_settings
        ])
        .run(tauri::generate_context!())
        .expect("failed to run TextLens");
}
