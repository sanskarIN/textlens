use std::path::PathBuf;

use crate::{
    domain::{
        analyzer,
        models::{AnalysisOptions, AnalysisReport},
    },
    error::AppError,
    fileio,
    report::ReportExportOptions,
    settings_backup::{self, SettingsData},
};

#[tauri::command]
pub fn analyze_text(text: String, options: AnalysisOptions) -> Result<AnalysisReport, String> {
    tracing::debug!(
        operation = "analyze_text",
        input_bytes = text.len(),
        "analysis requested"
    );
    Ok(analyzer::analyze_text(&text, options))
}

#[tauri::command]
pub async fn analyze_file(
    path: String,
    options: AnalysisOptions,
) -> Result<AnalysisReport, String> {
    tracing::debug!(operation = "analyze_file", "analysis requested");
    tauri::async_runtime::spawn_blocking(move || {
        fileio::analyze_path(PathBuf::from(path).as_path(), options)
    })
    .await
    .map_err(|error| AppError::BackgroundTask(error.to_string()).to_string())?
    .map_err(|error| error.to_string())
}

#[tauri::command]
pub async fn export_report(
    path: String,
    report: AnalysisReport,
    format: String,
    options: Option<ReportExportOptions>,
) -> Result<(), String> {
    tracing::debug!(operation = "export_report", "report export requested");
    tauri::async_runtime::spawn_blocking(move || {
        crate::report::write_report_with_options(
            PathBuf::from(path).as_path(),
            &report,
            &format,
            options.unwrap_or_default(),
        )
    })
    .await
    .map_err(|error| AppError::BackgroundTask(error.to_string()).to_string())?
    .map_err(|error| error.to_string())
}

#[tauri::command]
pub async fn import_report(path: String) -> Result<AnalysisReport, String> {
    tracing::debug!(operation = "import_report", "report import requested");
    tauri::async_runtime::spawn_blocking(move || {
        crate::report::read_report(PathBuf::from(path).as_path())
    })
    .await
    .map_err(|error| AppError::BackgroundTask(error.to_string()).to_string())?
    .map_err(|error| error.to_string())
}

#[tauri::command]
pub async fn export_settings(path: String, settings: SettingsData) -> Result<(), String> {
    tracing::debug!(operation = "export_settings", "settings backup requested");
    tauri::async_runtime::spawn_blocking(move || {
        settings_backup::write(PathBuf::from(path).as_path(), settings)
    })
    .await
    .map_err(|error| AppError::BackgroundTask(error.to_string()).to_string())?
    .map_err(|error| error.to_string())
}

#[tauri::command]
pub async fn import_settings(path: String) -> Result<SettingsData, String> {
    tracing::debug!(operation = "import_settings", "settings restore requested");
    tauri::async_runtime::spawn_blocking(move || {
        settings_backup::read(PathBuf::from(path).as_path())
    })
    .await
    .map_err(|error| AppError::BackgroundTask(error.to_string()).to_string())?
    .map_err(|error| error.to_string())
}
