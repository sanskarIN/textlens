import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const ignoredDirectories = new Set([".git", "dist", "node_modules", "target"]);
const markdownFiles = await collectMarkdown(root);
const failures = [];

for (const file of markdownFiles) {
  const source = await readFile(file, "utf8");
  for (const target of markdownTargets(source)) {
    const normalized = normalizeLocalTarget(target);
    if (!normalized) continue;

    const resolved = normalized.startsWith("/")
      ? path.resolve(root, normalized.slice(1))
      : path.resolve(path.dirname(file), normalized);

    const relative = path.relative(root, resolved);
    if (relative.startsWith("..") || path.isAbsolute(relative)) {
      failures.push(`${path.relative(root, file)} -> ${target} escapes the repository`);
      continue;
    }

    try {
      await access(resolved);
    } catch {
      failures.push(`${path.relative(root, file)} -> ${target} does not exist`);
    }
  }
}

if (failures.length) {
  console.error("Documentation link check failed:\n");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`Documentation link check passed for ${markdownFiles.length} Markdown files.`);
}

async function collectMarkdown(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectMarkdown(absolute)));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(absolute);
    }
  }

  return files;
}

function markdownTargets(source) {
  const targets = [];
  const expression = /!?\[[^\]]*\]\(([^)]+)\)/g;
  for (const match of source.matchAll(expression)) {
    const raw = match[1]?.trim();
    if (!raw) continue;
    targets.push(raw.replace(/^<|>$/g, ""));
  }
  return targets;
}

function normalizeLocalTarget(target) {
  if (
    target.startsWith("#") ||
    target.startsWith("mailto:") ||
    target.startsWith("data:") ||
    /^[a-z][a-z0-9+.-]*:\/\//i.test(target)
  ) {
    return null;
  }

  const withoutTitle = target.replace(/\s+["'][^"']*["']\s*$/, "");
  const withoutFragment = withoutTitle.split("#", 1)[0];
  const withoutQuery = withoutFragment.split("?", 1)[0];
  if (!withoutQuery) return null;

  try {
    return decodeURIComponent(withoutQuery);
  } catch {
    return withoutQuery;
  }
}
