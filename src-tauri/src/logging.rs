use tracing_subscriber::EnvFilter;

/// Initializes application logging without recording document contents or paths.
pub fn init() {
    let filter = EnvFilter::try_from_env("TEXTLENS_LOG_LEVEL").unwrap_or_else(|_| EnvFilter::new("info"));
    let _ = tracing_subscriber::fmt().with_env_filter(filter).with_target(false).compact().try_init();
}
