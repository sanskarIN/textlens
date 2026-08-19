use std::path::PathBuf;

use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("The selected path is not a regular file.")]
    NotAFile,
    #[error("The selected file could not be read.")]
    ReadFile(#[source] std::io::Error),
    #[error("The report could not be written.")]
    WriteReport(#[source] std::io::Error),
    #[error("The report could not be read.")]
    ReadReport(#[source] std::io::Error),
    #[error("The report file is larger than the supported limit.")]
    ReportTooLarge,
    #[error("The report is not valid TextLens report JSON.")]
    InvalidReport(#[source] serde_json::Error),
    #[error("The report uses unsupported schema version {0}.")]
    UnsupportedReportVersion(u8),
    #[error("The report contains unsupported or inconsistent values.")]
    InvalidReportData,
    #[error("The settings backup could not be written.")]
    WriteSettings(#[source] std::io::Error),
    #[error("The settings backup could not be read.")]
    ReadSettings(#[source] std::io::Error),
    #[error("The settings backup is larger than the supported limit.")]
    SettingsTooLarge,
    #[error("The settings backup is not valid TextLens settings JSON.")]
    InvalidSettings(#[source] serde_json::Error),
    #[error("The settings backup contains unsupported or out-of-range values.")]
    InvalidSettingsData,
    #[error("The destination must have a parent directory.")]
    InvalidDestination,
    #[error("The destination directory does not exist: {0}")]
    MissingDestination(PathBuf),
    #[error("Unsupported report format: {0}")]
    UnsupportedFormat(String),
    #[error("Background analysis task failed: {0}")]
    BackgroundTask(String),
    #[error("The report could not be serialized.")]
    Serialize(#[source] serde_json::Error),
}
