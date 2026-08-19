import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, readdir, writeFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import process from "node:process";

const root = resolve(process.argv[2] ?? "artifacts");
const output = resolve(process.argv[3] ?? "release-metadata/SHA256SUMS.txt");

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

let files;
try {
  files = (await listFiles(root)).sort((a, b) =>
    relative(root, a).localeCompare(relative(root, b), "en"),
  );
} catch (error) {
  console.error(`Could not read release artifacts: ${error.message}`);
  process.exit(1);
}

if (!files.length) {
  console.error(`No release artifacts found under ${root}.`);
  process.exit(1);
}

const lines = [];
for (const file of files) {
  const digest = await sha256(file);
  const path = relative(root, file).split("\\").join("/");
  lines.push(`${digest}  ${path}`);
}

await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${lines.join("\n")}\n`, "utf8");
console.log(`Wrote ${lines.length} SHA-256 checksums to ${output}.`);
