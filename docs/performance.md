# Performance

## Budgets

- Typical sub-100 KiB pasted text should feel immediate on a modern desktop.
- Files above 8 MiB should stream where the encoding strategy safely permits.
- Live input is debounced by 180 ms.
- Analysis requires no network request.

These are engineering budgets, not universal benchmark claims.

## Streaming

`TEXTLENS_LARGE_FILE_THRESHOLD_MIB` controls the threshold (default 8 MiB, range 1..1024).

Large UTF-8/Windows-1252 files use `BufReader::read_until` and a streaming accumulator. Memory retains aggregate maps and the current logical line rather than the full document.

UTF-16 uses memory mode because a byte-level line boundary can split UTF-16 code units. Any future UTF-16 streaming implementation must preserve code-unit and surrogate boundaries.

## Complexity

For input bytes `n`, tokens `w`, unique frequency keys `k`:

- scanning/tokenization: approximately O(n);
- accumulation: expected O(w);
- final ranking: O(k log k).

## Benchmark harness

Run the repository-owned synthetic benchmark after installing the Rust toolchain:

```bash
cd src-tauri
cargo run --release --example benchmark -- 10
```

The final argument is the approximate input size in MiB. Repeat with `1`, `10`, and `100`, then add long single-line and high-cardinality synthetic fixtures when investigating a hot path. Record CPU time, peak memory, and throughput in performance-change pull requests.

Never benchmark using private documents.
