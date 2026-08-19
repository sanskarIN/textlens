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

The unique-word metric reuses the keyword frequency map and therefore does not require a second vocabulary collection.

## Benchmark harness

Run the repository-owned synthetic benchmark after installing the Rust toolchain:

```bash
cd src-tauri
cargo run --release --example benchmark -- 16 5
```

The first argument is the approximate input size in MiB (1–512). The second is the iteration count (1–25). The harness reports every iteration plus average throughput so warm-up and outlier behavior are visible.

For meaningful comparisons:

1. Use a release build.
2. Keep the same machine, power mode, OS, and Rust toolchain.
3. Close unrelated CPU-heavy programs.
4. Run at least five iterations.
5. Compare both elapsed time and throughput.
6. Add long single-line and high-cardinality synthetic fixtures when investigating a hot path.
7. Record peak memory with an OS profiler when changing streaming behavior.

Never benchmark using private documents.
