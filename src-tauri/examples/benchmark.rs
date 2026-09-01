use std::{hint::black_box, time::Instant};

use textlens_lib::domain::{analyzer::analyze_text, models::AnalysisOptions};

const DEFAULT_MIB: usize = 16;
const DEFAULT_ITERATIONS: usize = 5;

fn main() {
    let target_mib = argument(1, DEFAULT_MIB, 1, 512);
    let iterations = argument(2, DEFAULT_ITERATIONS, 1, 25);
    let target_bytes = target_mib * 1024 * 1024;
    let sample = "TextLens measures Unicode words, sentences, whitespace, and local text patterns. नमस्ते दुनिया. こんにちは世界.\n";
    let repeats = target_bytes.div_ceil(sample.len());
    let generated = sample.repeat(repeats);
    let input = &generated[..target_bytes.min(generated.len())];
    let actual_mib = input.len() as f64 / (1024.0 * 1024.0);

    println!("TextLens analyzer benchmark: {actual_mib:.2} MiB, {iterations} iterations");

    let mut elapsed_total = 0.0_f64;
    let mut words = 0_usize;
    for iteration in 1..=iterations {
        let started = Instant::now();
        let report = analyze_text(black_box(input), AnalysisOptions::default());
        let elapsed = started.elapsed().as_secs_f64();
        elapsed_total += elapsed;
        words = report.stats.words;
        let throughput = actual_mib / elapsed.max(f64::EPSILON);
        println!(
            "iteration {iteration}: {:.3}s ({throughput:.1} MiB/s)",
            elapsed
        );
    }

    let average = elapsed_total / iterations as f64;
    println!("average_seconds={average:.4}");
    println!("average_throughput_mib_per_s={:.2}", actual_mib / average);
    println!("words={words}");
}

fn argument(index: usize, fallback: usize, min: usize, max: usize) -> usize {
    std::env::args()
        .nth(index)
        .and_then(|value| value.parse::<usize>().ok())
        .filter(|value| (min..=max).contains(value))
        .unwrap_or(fallback)
}
