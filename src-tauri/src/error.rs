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
