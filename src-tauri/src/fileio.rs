use std::{
    fs::File,
    io::{BufRead, BufReader, Read},
    path::Path,
};

use crate::{
    domain::{
        analyzer::AnalysisAccumulator,
        models::{
            AnalysisMode, AnalysisOptions, AnalysisReport, EncodingInfo, SourceInfo, SourceKind,
        },
    },
    error::AppError,
};

const DEFAULT_STREAMING_THRESHOLD: u64 = 8 * 1024 * 1024;
const DETECTION_SAMPLE_BYTES: usize = 32 * 1024;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum DetectedEncoding {
    Utf8,
    Utf16Le,
    Utf16Be,
    Windows1252,
}

pub fn analyze_path(path: &Path, options: AnalysisOptions) -> Result<AnalysisReport, AppError> {
    let metadata = std::fs::metadata(path).map_err(AppError::ReadFile)?;
    if !metadata.is_file() {
        return Err(AppError::NotAFile);
    }

    let file_size = metadata.len();
    let mut file = File::open(path).map_err(AppError::ReadFile)?;
    let sample_capacity = usize::try_from(file_size)
        .unwrap_or(usize::MAX)
        .min(DETECTION_SAMPLE_BYTES);
    let mut sample = vec![0_u8; sample_capacity];
    let sample_len = file.read(&mut sample).map_err(AppError::ReadFile)?;
    sample.truncate(sample_len);
    let (encoding, bom_detected, fallback_used) = detect_encoding(&sample);
    drop(file);

    let display_name = path
        .file_name()
        .map(|name| name.to_string_lossy().into_owned())
        .filter(|name| !name.is_empty());
    let source = |mode| SourceInfo {
        kind: SourceKind::File,
        display_name: display_name.clone(),
        mode,
        file_size: Some(file_size),
    };

    if file_size > streaming_threshold_bytes()
        && matches!(encoding, DetectedEncoding::Utf8 | DetectedEncoding::Windows1252)
    {
        let (mut report, had_errors) = analyze_streaming(
            path,
            options,
            encoding,
            source(AnalysisMode::Streaming),
        )?;
        report.encoding = Some(EncodingInfo {
            name: encoding_name(encoding).into(),
            bom_detected,
            fallback_used,
            had_errors,
        });
        return Ok(report);
    }

    let bytes = std::fs::read(path).map_err(AppError::ReadFile)?;
    let (text, had_errors) = decode_all(&bytes, encoding);
    let mut accumulator = AnalysisAccumulator::new(options);
    accumulator.push_line_chunk(&text, bytes.len());
    Ok(accumulator.finish(
        source(AnalysisMode::Memory),
        Some(EncodingInfo {
            name: encoding_name(encoding).into(),
            bom_detected,
            fallback_used,
            had_errors,
        }),
    ))
}

fn analyze_streaming(
    path: &Path,
    options: AnalysisOptions,
    encoding: DetectedEncoding,
    source: SourceInfo,
) -> Result<(AnalysisReport, bool), AppError> {
    let file = File::open(path).map_err(AppError::ReadFile)?;
    let mut reader = BufReader::with_capacity(128 * 1024, file);
    let mut accumulator = AnalysisAccumulator::new(options);
    let mut raw = Vec::with_capacity(8 * 1024);
    let mut had_errors = false;
    let mut first = true;

    loop {
        raw.clear();
        let read = reader.read_until(b'\n', &mut raw).map_err(AppError::ReadFile)?;
        if read == 0 {
            break;
        }

        let payload = if first && encoding == DetectedEncoding::Utf8 {
            raw.strip_prefix(&[0xEF, 0xBB, 0xBF]).unwrap_or(&raw)
        } else {
            &raw
        };
        first = false;

        let (line, line_errors) = match encoding {
            DetectedEncoding::Utf8 => decode_utf8(payload),
            DetectedEncoding::Windows1252 => decode_windows_1252(payload),
            DetectedEncoding::Utf16Le | DetectedEncoding::Utf16Be => {
                unreachable!("UTF-16 uses memory mode")
            }
        };
        had_errors |= line_errors;
        accumulator.push_line_chunk(&line, read);
    }

    Ok((accumulator.finish(source, None), had_errors))
}

fn detect_encoding(sample: &[u8]) -> (DetectedEncoding, bool, bool) {
    if sample.starts_with(&[0xEF, 0xBB, 0xBF]) {
        return (DetectedEncoding::Utf8, true, false);
    }
    if sample.starts_with(&[0xFF, 0xFE]) {
        return (DetectedEncoding::Utf16Le, true, false);
    }
    if sample.starts_with(&[0xFE, 0xFF]) {
        return (DetectedEncoding::Utf16Be, true, false);
    }
    if std::str::from_utf8(sample).is_ok() {
        return (DetectedEncoding::Utf8, false, false);
    }
    (DetectedEncoding::Windows1252, false, true)
}

fn decode_all(bytes: &[u8], encoding: DetectedEncoding) -> (String, bool) {
    match encoding {
        DetectedEncoding::Utf8 => {
            decode_utf8(bytes.strip_prefix(&[0xEF, 0xBB, 0xBF]).unwrap_or(bytes))
        }
        DetectedEncoding::Utf16Le => decode_utf16(bytes, true),
        DetectedEncoding::Utf16Be => decode_utf16(bytes, false),
        DetectedEncoding::Windows1252 => decode_windows_1252(bytes),
    }
}

fn decode_utf8(bytes: &[u8]) -> (String, bool) {
    match std::str::from_utf8(bytes) {
        Ok(text) => (text.to_owned(), false),
        Err(_) => (String::from_utf8_lossy(bytes).into_owned(), true),
    }
}

fn decode_utf16(bytes: &[u8], little_endian: bool) -> (String, bool) {
    let payload = if little_endian {
        bytes.strip_prefix(&[0xFF, 0xFE]).unwrap_or(bytes)
    } else {
        bytes.strip_prefix(&[0xFE, 0xFF]).unwrap_or(bytes)
    };

    let mut had_errors = payload.len() % 2 != 0;
    let units = payload.chunks_exact(2).map(|pair| {
        if little_endian {
            u16::from_le_bytes([pair[0], pair[1]])
        } else {
            u16::from_be_bytes([pair[0], pair[1]])
        }
    });

    let mut output = String::with_capacity(payload.len() / 2);
    for item in char::decode_utf16(units) {
        match item {
            Ok(character) => output.push(character),
            Err(_) => {
                had_errors = true;
                output.push('\u{FFFD}');
            }
        }
    }
    if payload.len() % 2 != 0 {
        output.push('\u{FFFD}');
    }

    (output, had_errors)
}

fn decode_windows_1252(bytes: &[u8]) -> (String, bool) {
    let mut had_errors = false;
    let output = bytes
        .iter()
        .copied()
        .map(|byte| match windows_1252_char(byte) {
            Some(character) => character,
            None => {
                had_errors = true;
                '\u{FFFD}'
            }
        })
        .collect();
    (output, had_errors)
}

fn windows_1252_char(byte: u8) -> Option<char> {
    match byte {
        0x80 => Some('€'),
        0x81 | 0x8D | 0x8F | 0x90 | 0x9D => None,
        0x82 => Some('‚'),
        0x83 => Some('ƒ'),
        0x84 => Some('„'),
        0x85 => Some('…'),
        0x86 => Some('†'),
        0x87 => Some('‡'),
        0x88 => Some('ˆ'),
        0x89 => Some('‰'),
        0x8A => Some('Š'),
        0x8B => Some('‹'),
        0x8C => Some('Œ'),
        0x8E => Some('Ž'),
        0x91 => Some('‘'),
        0x92 => Some('’'),
        0x93 => Some('“'),
        0x94 => Some('”'),
        0x95 => Some('•'),
        0x96 => Some('–'),
        0x97 => Some('—'),
        0x98 => Some('˜'),
        0x99 => Some('™'),
        0x9A => Some('š'),
        0x9B => Some('›'),
        0x9C => Some('œ'),
        0x9E => Some('ž'),
        0x9F => Some('Ÿ'),
        _ => char::from_u32(u32::from(byte)),
    }
}

fn encoding_name(encoding: DetectedEncoding) -> &'static str {
    match encoding {
        DetectedEncoding::Utf8 => "UTF-8",
        DetectedEncoding::Utf16Le => "UTF-16 LE",
        DetectedEncoding::Utf16Be => "UTF-16 BE",
        DetectedEncoding::Windows1252 => "Windows-1252",
    }
}

fn streaming_threshold_bytes() -> u64 {
    std::env::var("TEXTLENS_LARGE_FILE_THRESHOLD_MIB")
        .ok()
        .and_then(|value| value.parse::<u64>().ok())
        .filter(|value| (1..=1024).contains(value))
        .unwrap_or(DEFAULT_STREAMING_THRESHOLD / (1024 * 1024))
        .saturating_mul(1024 * 1024)
}

#[cfg(test)]
mod tests {
    use std::io::Write;

    use tempfile::NamedTempFile;

    use super::*;

    #[test]
    fn detects_common_encodings() {
        assert_eq!(
            detect_encoding(&[0xEF, 0xBB, 0xBF, b'a']).0,
            DetectedEncoding::Utf8
        );
        assert_eq!(
            detect_encoding(&[0xFF, 0xFE, b'a', 0]).0,
            DetectedEncoding::Utf16Le
        );
        assert_eq!(
            detect_encoding("café".as_bytes()).0,
            DetectedEncoding::Utf8
        );
    }

    #[test]
    fn decodes_utf16_le() {
        let (text, errors) = decode_all(
            &[0xFF, 0xFE, b'H', 0, b'i', 0],
            DetectedEncoding::Utf16Le,
        );
        assert_eq!(text, "Hi");
        assert!(!errors);
    }

    #[test]
    fn hides_full_path() {
        let mut file = NamedTempFile::new().unwrap();
        write!(file, "hello world").unwrap();
        let report = analyze_path(file.path(), AnalysisOptions::default()).unwrap();
        assert_eq!(report.stats.words, 2);
        assert_eq!(report.source.kind, SourceKind::File);
        assert!(report.source.display_name.is_some());
    }

    #[test]
    fn malformed_utf8_fixture_reports_replacement() {
        let bytes = parse_hex(include_str!("../tests/fixtures/malformed-utf8.hex"));
        let (text, errors) = decode_utf8(&bytes);
        assert!(errors);
        assert_eq!(text, "fo\u{FFFD}o");
    }

    #[test]
    fn windows_1252_edge_fixture_flags_undefined_byte() {
        let bytes = parse_hex(include_str!("../tests/fixtures/windows-1252-edge.hex"));
        let (text, errors) = decode_windows_1252(&bytes);
        assert!(errors);
        assert_eq!(text, "Hi \u{FFFD} €");
    }

    #[test]
    fn utf16_boundary_fixture_flags_odd_trailing_byte() {
        let bytes = parse_hex(include_str!("../tests/fixtures/utf16le-boundary.hex"));
        let (text, errors) = decode_utf16(&bytes, true);
        assert!(errors);
        assert_eq!(text, "Hi\u{FFFD}");
    }

    fn parse_hex(source: &str) -> Vec<u8> {
        source
            .split_whitespace()
            .map(|value| u8::from_str_radix(value, 16).expect("fixture contains valid hex bytes"))
            .collect()
    }
}
