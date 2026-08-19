use textlens_lib::domain::models::CURRENT_REPORT_VERSION;

#[test]
fn stable_report_schema_remains_v2() {
    assert_eq!(
        CURRENT_REPORT_VERSION, 2,
        "changing the stable report schema requires an explicit compatibility decision, migration tests, and docs/report-schema.md updates"
    );
}
