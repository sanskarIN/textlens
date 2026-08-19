import { readFile } from "node:fs/promises";
import process from "node:process";

const root = new URL("../", import.meta.url);

async function readText(path) {
  return readFile(new URL(path, root), "utf8");
}

function readCargoPackageVersion(source) {
  const packageSection = source.match(/(?:^|\n)\[package\]\s*\n([\s\S]*?)(?=\n\[[^\]]+\]|$)/)?.[1];
  const version = packageSection?.match(/^\s*version\s*=\s*"([^"]+)"\s*$/m)?.[1];
  if (!version) throw new Error("Could not read [package].version from src-tauri/Cargo.toml");
  return version;
}

const [packageSource, tauriSource, cargoSource] = await Promise.all([
  readText("package.json"),
  readText("src-tauri/tauri.conf.json"),
  readText("src-tauri/Cargo.toml"),
]);

const packageVersion = JSON.parse(packageSource).version;
const tauriVersion = JSON.parse(tauriSource).version;
const cargoVersion = readCargoPackageVersion(cargoSource);

const versions = [
  ["package.json", packageVersion],
  ["src-tauri/tauri.conf.json", tauriVersion],
  ["src-tauri/Cargo.toml", cargoVersion],
];

if (versions.some(([, version]) => typeof version !== "string" || !version.trim())) {
  console.error("Version metadata is missing or invalid:");
  for (const [file, version] of versions) console.error(`- ${file}: ${String(version)}`);
  process.exit(1);
}

const expected = packageVersion;
const mismatches = versions.filter(([, version]) => version !== expected);
if (mismatches.length) {
  console.error(`Version metadata is out of sync. Expected ${expected}:`);
  for (const [file, version] of versions) console.error(`- ${file}: ${version}`);
  process.exit(1);
}

console.log(`Version metadata is synchronized at ${expected}.`);
