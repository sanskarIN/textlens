use std::path::PathBuf;
use crate::{domain::{analyzer, models::{AnalysisOptions, AnalysisReport}}, error::AppError, fileio, report};

#[tauri::command]
pub fn analyze_text(text: String, options: AnalysisOptions) -> Result<AnalysisReport, String> { tracing::debug!(operation = "analyze_text", input_bytes = text.len(), "analysis requested"); Ok(analyzer::analyze_text(&text, options)) }
#[tauri::command]
pub async fn analyze_file(path: String, options: AnalysisOptions) -> Result<AnalysisReport, String> { tracing::debug!(operation = "analyze_file", "analysis requested"); tauri::async_runtime::spawn_blocking(move || fileio::analyze_path(PathBuf::from(path).as_path(), options)).await.map_err(|e| AppError::BackgroundTask(e.to_string()).to_string())?.map_err(|e| e.to_string()) }
#[tauri::command]
pub async fn export_report(path: String, report: AnalysisReport, format: String) -> Result<(), String> { tracing::debug!(operation = "export_report", "report export requested"); tauri::async_runtime::spawn_blocking(move || report::write_report(PathBuf::from(path).as_path(), &report, &format)).await.map_err(|e| AppError::BackgroundTask(e.to_string()).to_string())?.map_err(|e| e.to_string()) }
