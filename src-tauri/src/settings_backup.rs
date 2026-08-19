use std::{fs, path::Path};

use serde::{Deserialize, Serialize};

use crate::error::AppError;

const SETTINGS_BACKUP_VERSION: u8 = 1;
const MAX_SETTINGS_BACKUP_BYTES: u64 = 64 * 1024;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct SettingsData {
    pub theme: String,
    pub reading_wpm: u32,
    pub speaking_wpm: u32,
    pub top_keywords: usize,
    pub top_ngrams: usize,
    pub reduced_motion: bool,
}

impl SettingsData {
    fn validate(self) -> Result<Self, AppError> {
        if !matches!(self.theme.as_str(), "system" | "light" | "dark")
            || !(30..=1000).contains(&self.reading_wpm)
            || !(30..=1000).contains(&self.speaking_wpm)
            || !(1..=50).contains(&self.top_keywords)
            || !(1..=50).contains(&self.top_ngrams)
        {
            return Err(invalid_settings_error());
        }
        Ok(self)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct SettingsBackup {
    version: u8,
    settings: SettingsData,
}

pub fn write(path: &Path, settings: SettingsData) -> Result<(), AppError> {
    validate_destination(path)?;
    let backup = SettingsBackup {
        version: SETTINGS_BACKUP_VERSION,
        settings: settings.validate()?,
    };
    let content = serde_json::to_vec_pretty(&backup).map_err(AppError::Serialize)?;
    if content.len() as u64 > MAX_SETTINGS_BACKUP_BYTES {
        return Err(AppError::SettingsTooLarge);
    }
    atomic_write(path, &content)
}

pub fn read(path: &Path) -> Result<SettingsData, AppError> {
    let metadata = fs::metadata(path).map_err(AppError::ReadSettings)?;
    if !metadata.is_file() {
        return Err(AppError::NotAFile);
    }
    if metadata.len() > MAX_SETTINGS_BACKUP_BYTES {
        return Err(AppError::SettingsTooLarge);
    }

    let bytes = fs::read(path).map_err(AppError::ReadSettings)?;
    let backup: SettingsBackup =
        serde_json::from_slice(&bytes).map_err(AppError::InvalidSettings)?;
    if backup.version != SETTINGS_BACKUP_VERSION {
        return Err(invalid_settings_error());
    }
    backup.settings.validate()
}

fn validate_destination(path: &Path) -> Result<(), AppError> {
    let Some(parent) = path.parent() else {
        return Err(AppError::InvalidDestination);
    };
    if !parent.as_os_str().is_empty() && !parent.exists() {
        return Err(AppError::MissingDestination(parent.to_path_buf()));
    }
    Ok(())
}

fn atomic_write(path: &Path, contents: &[u8]) -> Result<(), AppError> {
    let name = path
        .file_name()
        .and_then(|value| value.to_str())
        .unwrap_or("textlens-settings.json");
    let temp = path.with_file_name(format!(".{name}.tmp"));
    let backup = path.with_file_name(format!(".{name}.textlens-backup"));

    fs::write(&temp, contents).map_err(AppError::WriteSettings)?;
    if !path.exists() {
        return fs::rename(&temp, path).map_err(|error| {
            let _ = fs::remove_file(&temp);
            AppError::WriteSettings(error)
        });
    }

    if backup.exists() {
        fs::remove_file(&backup).map_err(AppError::WriteSettings)?;
    }
    fs::rename(path, &backup).map_err(|error| {
        let _ = fs::remove_file(&temp);
        AppError::WriteSettings(error)
    })?;

    match fs::rename(&temp, path) {
        Ok(()) => {
            let _ = fs::remove_file(&backup);
            Ok(())
        }
        Err(error) => {
            let _ = fs::rename(&backup, path);
            let _ = fs::remove_file(&temp);
            Err(AppError::WriteSettings(error))
        }
    }
}

fn invalid_settings_error() -> AppError {
    AppError::InvalidSettings(
        serde_json::from_str::<SettingsBackup>("null").expect_err("null is not a settings backup"),
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sample_settings() -> SettingsData {
        SettingsData {
            theme: "dark".into(),
            reading_wpm: 238,
            speaking_wpm: 150,
            top_keywords: 12,
            top_ngrams: 10,
            reduced_motion: true,
        }
    }

    #[test]
    fn backup_round_trip() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("settings.json");
        let expected = sample_settings();
        write(&path, expected.clone()).unwrap();
        assert_eq!(read(&path).unwrap(), expected);
    }

    #[test]
    fn rejects_out_of_range_settings() {
        let mut settings = sample_settings();
        settings.reading_wpm = 0;
        assert!(settings.validate().is_err());
    }

    #[test]
    fn rejects_unknown_backup_fields() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("settings.json");
        fs::write(
            &path,
            r#"{"version":1,"settings":{"theme":"system","readingWpm":238,"speakingWpm":150,"topKeywords":12,"topNgrams":10,"reducedMotion":false},"unexpected":true}"#,
        )
        .unwrap();
        assert!(read(&path).is_err());
    }
}
