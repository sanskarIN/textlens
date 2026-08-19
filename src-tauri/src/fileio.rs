use std::{fs::File, io::{BufRead, BufReader, Read}, path::Path};
use crate::{domain::{analyzer::AnalysisAccumulator, models::{AnalysisMode, AnalysisOptions, AnalysisReport, EncodingInfo, SourceInfo, SourceKind}}, error::AppError};

const DEFAULT_STREAMING_THRESHOLD: u64 = 8 * 1024 * 1024;
const DETECTION_SAMPLE_BYTES: usize = 32 * 1024;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum DetectedEncoding { Utf8, Utf16Le, Utf16Be, Windows1252 }

pub fn analyze_path(path: &Path, options: AnalysisOptions) -> Result<AnalysisReport, AppError> {
    let metadata = std::fs::metadata(path).map_err(AppError::ReadFile)?;
    if !metadata.is_file() { return Err(AppError::NotAFile); }
    let file_size = metadata.len();
    let mut file = File::open(path).map_err(AppError::ReadFile)?;
    let sample_capacity = usize::try_from(file_size).unwrap_or(usize::MAX).min(DETECTION_SAMPLE_BYTES);
    let mut sample = vec![0_u8; sample_capacity];
    let sample_len = file.read(&mut sample).map_err(AppError::ReadFile)?;
    sample.truncate(sample_len);
    let (encoding, bom_detected, fallback_used) = detect_encoding(&sample);
    drop(file);
    let display_name = path.file_name().map(|n| n.to_string_lossy().into_owned()).filter(|n| !n.is_empty());
    let source = |mode| SourceInfo { kind: SourceKind::File, display_name: display_name.clone(), mode, file_size: Some(file_size) };
    if file_size > streaming_threshold_bytes() && matches!(encoding, DetectedEncoding::Utf8 | DetectedEncoding::Windows1252) {
        let (mut report, had_errors) = analyze_streaming(path, options, encoding, source(AnalysisMode::Streaming))?;
        report.encoding = Some(EncodingInfo { name: encoding_name(encoding).into(), bom_detected, fallback_used, had_errors });
        return Ok(report);
    }
    let bytes = std::fs::read(path).map_err(AppError::ReadFile)?;
    let (text, had_errors) = decode_all(&bytes, encoding);
    let mut acc = AnalysisAccumulator::new(options);
    acc.push_line_chunk(&text, bytes.len());
    Ok(acc.finish(source(AnalysisMode::Memory), Some(EncodingInfo { name: encoding_name(encoding).into(), bom_detected, fallback_used, had_errors })))
}

fn analyze_streaming(path: &Path, options: AnalysisOptions, encoding: DetectedEncoding, source: SourceInfo) -> Result<(AnalysisReport, bool), AppError> {
    let file = File::open(path).map_err(AppError::ReadFile)?;
    let mut reader = BufReader::with_capacity(128 * 1024, file);
    let mut acc = AnalysisAccumulator::new(options);
    let mut raw = Vec::with_capacity(8 * 1024);
    let mut had_errors = false;
    let mut first = true;
    loop {
        raw.clear();
        let read = reader.read_until(b'\n', &mut raw).map_err(AppError::ReadFile)?;
        if read == 0 { break; }
        let payload = if first && encoding == DetectedEncoding::Utf8 { raw.strip_prefix(&[0xEF,0xBB,0xBF]).unwrap_or(&raw) } else { &raw };
        first = false;
        let (line, line_errors) = match encoding { DetectedEncoding::Utf8 => decode_utf8(payload), DetectedEncoding::Windows1252 => (decode_windows_1252(payload), false), _ => unreachable!("UTF-16 uses memory mode") };
        had_errors |= line_errors;
        acc.push_line_chunk(&line, read);
    }
    Ok((acc.finish(source, None), had_errors))
}

fn detect_encoding(sample: &[u8]) -> (DetectedEncoding, bool, bool) {
    if sample.starts_with(&[0xEF,0xBB,0xBF]) { return (DetectedEncoding::Utf8, true, false); }
    if sample.starts_with(&[0xFF,0xFE]) { return (DetectedEncoding::Utf16Le, true, false); }
    if sample.starts_with(&[0xFE,0xFF]) { return (DetectedEncoding::Utf16Be, true, false); }
    if std::str::from_utf8(sample).is_ok() { return (DetectedEncoding::Utf8, false, false); }
    (DetectedEncoding::Windows1252, false, true)
}
fn decode_all(bytes: &[u8], encoding: DetectedEncoding) -> (String, bool) { match encoding { DetectedEncoding::Utf8 => decode_utf8(bytes.strip_prefix(&[0xEF,0xBB,0xBF]).unwrap_or(bytes)), DetectedEncoding::Utf16Le => decode_utf16(bytes, true), DetectedEncoding::Utf16Be => decode_utf16(bytes, false), DetectedEncoding::Windows1252 => (decode_windows_1252(bytes), false) } }
fn decode_utf8(bytes: &[u8]) -> (String, bool) { match std::str::from_utf8(bytes) { Ok(s) => (s.to_owned(), false), Err(_) => (String::from_utf8_lossy(bytes).into_owned(), true) } }
fn decode_utf16(bytes: &[u8], little: bool) -> (String, bool) {
    let payload = if little { bytes.strip_prefix(&[0xFF,0xFE]).unwrap_or(bytes) } else { bytes.strip_prefix(&[0xFE,0xFF]).unwrap_or(bytes) };
    let mut had_errors = payload.len() % 2 != 0;
    let units = payload.chunks_exact(2).map(|p| if little { u16::from_le_bytes([p[0],p[1]]) } else { u16::from_be_bytes([p[0],p[1]]) });
    let mut out = String::with_capacity(payload.len()/2);
    for item in char::decode_utf16(units) { match item { Ok(c) => out.push(c), Err(_) => { had_errors = true; out.push('\u{FFFD}'); } } }
    if payload.len() % 2 != 0 { out.push('\u{FFFD}'); }
    (out, had_errors)
}
fn decode_windows_1252(bytes: &[u8]) -> String { bytes.iter().copied().map(windows_1252_char).collect() }
fn windows_1252_char(byte: u8) -> char { match byte { 0x80=>'€',0x82=>'‚',0x83=>'ƒ',0x84=>'„',0x85=>'…',0x86=>'†',0x87=>'‡',0x88=>'ˆ',0x89=>'‰',0x8A=>'Š',0x8B=>'‹',0x8C=>'Œ',0x8E=>'Ž',0x91=>'‘',0x92=>'’',0x93=>'“',0x94=>'”',0x95=>'•',0x96=>'–',0x97=>'—',0x98=>'˜',0x99=>'™',0x9A=>'š',0x9B=>'›',0x9C=>'œ',0x9E=>'ž',0x9F=>'Ÿ', _ => char::from_u32(u32::from(byte)).unwrap_or('\u{FFFD}') } }
fn encoding_name(e: DetectedEncoding) -> &'static str { match e { DetectedEncoding::Utf8=>"UTF-8", DetectedEncoding::Utf16Le=>"UTF-16 LE", DetectedEncoding::Utf16Be=>"UTF-16 BE", DetectedEncoding::Windows1252=>"Windows-1252" } }
fn streaming_threshold_bytes() -> u64 { std::env::var("TEXTLENS_LARGE_FILE_THRESHOLD_MIB").ok().and_then(|v| v.parse::<u64>().ok()).filter(|v| (1..=1024).contains(v)).unwrap_or(DEFAULT_STREAMING_THRESHOLD/(1024*1024)).saturating_mul(1024*1024) }

#[cfg(test)] mod tests { use std::io::Write; use tempfile::NamedTempFile; use super::*;
#[test] fn detects_common_encodings(){ assert_eq!(detect_encoding(&[0xEF,0xBB,0xBF,b'a']).0,DetectedEncoding::Utf8); assert_eq!(detect_encoding(&[0xFF,0xFE,b'a',0]).0,DetectedEncoding::Utf16Le); assert_eq!(detect_encoding("café".as_bytes()).0,DetectedEncoding::Utf8); }
#[test] fn decodes_utf16_le(){ let (text, errors)=decode_all(&[0xFF,0xFE,b'H',0,b'i',0],DetectedEncoding::Utf16Le); assert_eq!(text,"Hi"); assert!(!errors); }
#[test] fn hides_full_path(){ let mut f=NamedTempFile::new().unwrap(); write!(f,"hello world").unwrap(); let r=analyze_path(f.path(),AnalysisOptions::default()).unwrap(); assert_eq!(r.stats.words,2); assert_eq!(r.source.kind,SourceKind::File); assert!(r.source.display_name.is_some()); }
}
