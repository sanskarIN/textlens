use std::{fs, path::Path};

use serde::{Deserialize, Serialize};

use crate::error::AppError;

const CURRENT_SETTINGS_BACKUP_VERSION: u8 = 2;
const MAX_SETTINGS_BACKUP_BYTES: u64 = 64 * 1024;
const MAX_KEYWORD_EXCLUSIONS: usize = 100;
const MAX_KEYWORD_EXCLUSION_CHARACTERS: usize = 64;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct SettingsData {
    pub theme: String,
    pub reading_wpm: u32,
    pub speaking_wpm: u32,
    pub top_keywords: usize,
    pub top_ngrams: usize,
    #[serde(default)]
    pub keyword_exclusions: Vec<String>,
    pub reduced_motion: bool,
    #[serde(default)]
    pub recent_files_enabled: bool,
}

impl SettingsData {
    fn validate(self) -> Result<Self, AppError> {
        if !matches!(self.theme.as_str(), "system" | "light" | "dark")
            || !(30..=1000).contains(&self.reading_wpm)
            || !(30..=1000).contains(&self.speaking_wpm)
            || !(1..=50).contains(&self.top_keywords)
            || !(1..=50).contains(&self.top_ngrams)
            || self.keyword_exclusions.len() > MAX_KEYWORD_EXCLUSIONS
            || self.keyword_exclusions.iter().any(|value| {
                value.trim().is_empty()
                    || value.chars().count() > MAX_KEYWORD_EXCLUSION_CHARACTERS
                    || value.contains('\0')
            })
        {
            return Err(AppError::InvalidSettingsData);
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
        version: CURRENT_SETTINGS_BACKUP_VERSION,
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
    if backup.version == 0 || backup.version > CURRENT_SETTINGS_BACKUP_VERSION {
        return Err(AppError::InvalidSettingsData);
    }
    backup.settings.validate()
}

fn validate_destination(path: &Path) -> Result<(), AppError> {
    let Some(parent) = path.parent() else {
        return Err(AppError::InvalidDestination);
    };
    if !parent.as_os_str().is_empty() && !parent.exists() {
        return Err(AppError::MissingDestination);
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
            keyword_exclusions: vec!["the".into(), "and".into()],
            reduced_motion: true,
            recent_files_enabled: true,
        }
    }

    #[test]
    fn backup_round_trip_uses_current_schema() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("settings.json");
        let expected = sample_settings();
        write(&path, expected.clone()).unwrap();
        let raw = fs::read_to_string(&path).unwrap();
        assert!(raw.contains("\"version\": 2"));
        assert_eq!(read(&path).unwrap(), expected);
    }

    #[test]
    fn reads_legacy_version_one_backup_without_new_preferences() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("settings.json");
        fs::write(
            &path,
            r#"{"version":1,"settings":{"theme":"system","readingWpm":238,"speakingWpm":150,"topKeywords":12,"topNgrams":10,"reducedMotion":false}}"#,
        )
        .unwrap();
        let restored = read(&path).unwrap();
        assert!(restored.keyword_exclusions.is_empty());
        assert!(!restored.recent_files_enabled);
    }

    #[test]
    fn rejects_future_backup_version() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("settings.json");
        fs::write(
            &path,
            r#"{"version":3,"settings":{"theme":"system","readingWpm":238,"speakingWpm":150,"topKeywords":12,"topNgrams":10,"keywordExclusions":[],"reducedMotion":false,"recentFilesEnabled":false}}"#,
        )
        .unwrap();
        assert!(matches!(read(&path), Err(AppError::InvalidSettingsData)));
    }

    #[test]
    fn rejects_out_of_range_settings() {
        let mut settings = sample_settings();
        settings.reading_wpm = 0;
        assert!(matches!(
            settings.validate(),
            Err(AppError::InvalidSettingsData)
        ));
    }

    #[test]
    fn rejects_invalid_keyword_exclusions() {
        let mut settings = sample_settings();
        settings.keyword_exclusions = vec!["x".repeat(65)];
        assert!(matches!(
            settings.validate(),
            Err(AppError::InvalidSettingsData)
        ));
    }

    #[test]
    fn rejects_unknown_backup_fields() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("settings.json");
        fs::write(
            &path,
            r#"{"version":2,"settings":{"theme":"system","readingWpm":238,"speakingWpm":150,"topKeywords":12,"topNgrams":10,"keywordExclusions":[],"reducedMotion":false,"recentFilesEnabled":false},"unexpected":true}"#,
        )
        .unwrap();
        assert!(read(&path).is_err());
    }

    #[test]
    fn missing_destination_error_does_not_disclose_path() {
        let dir = tempfile::tempdir().unwrap();
        let missing = dir.path().join("missing");
        let path = missing.join("settings.json");
        let error = write(&path, sample_settings()).unwrap_err();
        assert!(matches!(error, AppError::MissingDestination));
        assert!(!error
            .to_string()
            .contains(missing.to_string_lossy().as_ref()));
    }
}
