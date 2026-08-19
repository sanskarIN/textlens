import { readFile } from "node:fs/promises";
import process from "node:process";

const packageJson = JSON.parse(
  await readFile(new URL("../package.json", import.meta.url), "utf8"),
);

const version = packageJson.version;
const tag = process.env.GITHUB_REF_NAME ?? process.argv[2];

if (typeof version !== "string" || !version.trim()) {
  console.error("package.json does not contain a valid version.");
  process.exit(1);
}

if (!tag) {
  console.error("No release tag was provided. Set GITHUB_REF_NAME or pass the tag as an argument.");
  process.exit(1);
}

const expected = `v${version}`;
if (tag !== expected) {
  console.error(`Release tag mismatch: expected ${expected}, received ${tag}.`);
  process.exit(1);
}

console.log(`Release tag ${tag} matches application version ${version}.`);
