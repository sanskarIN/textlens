import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative } from "node:path";

const root = process.cwd();
const ignoredDirectories = new Set([".git", "node_modules", "dist", "target", ".vite", "coverage"]);
const checkedExtensions = new Set([
  ".css",
  ".html",
  ".js",
  ".json",
  ".md",
  ".mjs",
  ".rs",
  ".svg",
  ".toml",
  ".ts",
  ".yaml",
  ".yml",
]);
const checkedNames = new Set([
  ".editorconfig",
  ".env.example",
  ".gitattributes",
  ".gitignore",
  ".npmrc",
]);

const failures = [];

async function visit(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) {
      await visit(absolute);
      continue;
    }
    if (!entry.isFile()) continue;
    if (!checkedExtensions.has(extname(entry.name)) && !checkedNames.has(entry.name)) continue;
    const content = await readFile(absolute, "utf8");
    const display = relative(root, absolute).replaceAll("\\", "/");
    if (content.includes("\r\n") || content.includes("\r")) failures.push(`${display}: use LF line endings`);
    if (content.length > 0 && !content.endsWith("\n")) failures.push(`${display}: add a final newline`);
    if (extname(entry.name) !== ".md") {
      content.split("\n").forEach((line, index) => {
        if (/[ \t]+$/.test(line)) failures.push(`${display}:${index + 1}: remove trailing whitespace`);
      });
    }
  }
}

await visit(root);
if (failures.length) {
  console.error("Formatting policy violations:\n" + failures.map((item) => `- ${item}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log("Formatting policy check passed.");
}
