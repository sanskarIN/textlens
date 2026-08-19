import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import { isAbsolute, normalize, relative, resolve, sep } from "node:path";
import process from "node:process";

const root = resolve(process.argv[2] ?? "artifacts");
const manifest = resolve(process.argv[3] ?? "release-metadata/SHA256SUMS.txt");

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await listFiles(path)));
    else if (entry.isFile()) files.push(path);
  }
  return files;
}

function sha256(path) {
  return new Promise((resolveHash, reject) => {
    const hash = createHash("sha256");
    const stream = createReadStream(path);
    stream.on("error", reject);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolveHash(hash.digest("hex")));
  });
}

function normalizeManifestPath(value) {
  if (!value || isAbsolute(value) || value.includes("\0")) return null;
  const platformPath = value.split("/").join(sep);
  const normalized = normalize(platformPath);
  if (normalized === ".." || normalized.startsWith(`..${sep}`)) return null;
  return normalized;
}

let manifestText;
let actualFiles;
try {
  [manifestText, actualFiles] = await Promise.all([
    readFile(manifest, "utf8"),
    listFiles(root),
  ]);
} catch (error) {
  console.error(`Could not read release checksum inputs: ${error.message}`);
  process.exit(1);
}

const expectedByPath = new Map();
for (const [index, line] of manifestText.split(/\r?\n/).entries()) {
  if (!line) continue;
  const match = /^([a-f0-9]{64})  (.+)$/.exec(line);
  if (!match) {
    console.error(`Invalid checksum manifest line ${index + 1}.`);
    process.exit(1);
  }

  const normalized = normalizeManifestPath(match[2]);
  if (!normalized) {
    console.error(`Unsafe checksum manifest path on line ${index + 1}.`);
    process.exit(1);
  }
  if (expectedByPath.has(normalized)) {
    console.error(`Duplicate checksum manifest path: ${match[2]}`);
    process.exit(1);
  }
  expectedByPath.set(normalized, match[1]);
}

if (!expectedByPath.size) {
  console.error("Checksum manifest contains no artifact entries.");
  process.exit(1);
}

const actualRelativePaths = actualFiles
  .map((file) => relative(root, file))
  .sort((a, b) => a.localeCompare(b, "en"));

if (actualRelativePaths.length !== expectedByPath.size) {
  console.error(
    `Checksum manifest covers ${expectedByPath.size} files but artifact tree contains ${actualRelativePaths.length}.`,
  );
  process.exit(1);
}

for (const path of actualRelativePaths) {
  const expected = expectedByPath.get(path);
  if (!expected) {
    console.error(`Artifact is missing from checksum manifest: ${path}`);
    process.exit(1);
  }

  const file = resolve(root, path);
  const digest = await sha256(file);
  if (digest !== expected) {
    console.error(`Checksum mismatch: ${path}`);
    process.exit(1);
  }
}

console.log(`Verified SHA-256 checksums for ${actualRelativePaths.length} release artifacts.`);
