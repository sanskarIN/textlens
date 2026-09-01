import { createHash } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import process from "node:process";

const rootUrl = new URL("../", import.meta.url);
const rootPath = fileURLToPath(rootUrl);
const outputArg = process.argv[2] ?? "release-evidence/build.json";
const outputPath = resolve(rootPath, outputArg);

async function readJson(path) {
  return JSON.parse(await readFile(new URL(path, rootUrl), "utf8"));
}

function commandVersion(command, args = ["--version"]) {
  const executable = process.platform === "win32" && command === "npm" ? "npm.cmd" : command;
  const result = spawnSync(executable, args, { encoding: "utf8", windowsHide: true });
  if (result.error || result.status !== 0) {
    return {
      available: false,
      version: null,
      error: result.error?.message ?? result.stderr?.trim() ?? `exit ${String(result.status)}`,
    };
  }
  return { available: true, version: result.stdout.trim() || result.stderr.trim() || null, error: null };
}

async function lockEvidence(path) {
  try {
    const url = new URL(path, rootUrl);
    const [source, info] = await Promise.all([readFile(url), stat(url)]);
    return {
      path,
      present: true,
      bytes: info.size,
      sha256: createHash("sha256").update(source).digest("hex"),
    };
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return { path, present: false, bytes: null, sha256: null };
    }
    throw error;
  }
}

const packageJson = await readJson("package.json");
const evidence = {
  schemaVersion: 1,
  applicationVersion: packageJson.version,
  capturedAt: new Date().toISOString(),
  buildStatus: process.env.TEXTLENS_BUILD_STATUS ?? "unknown",
  git: {
    sha: process.env.GITHUB_SHA ?? null,
    ref: process.env.GITHUB_REF ?? null,
    refName: process.env.GITHUB_REF_NAME ?? null,
    refType: process.env.GITHUB_REF_TYPE ?? null,
    repository: process.env.GITHUB_REPOSITORY ?? null,
    runId: process.env.GITHUB_RUN_ID ?? null,
    runAttempt: process.env.GITHUB_RUN_ATTEMPT ?? null,
  },
  runner: {
    os: process.env.RUNNER_OS ?? process.platform,
    arch: process.env.RUNNER_ARCH ?? process.arch,
    nodePlatform: process.platform,
    nodeArch: process.arch,
  },
  toolchain: {
    node: { available: true, version: process.version, error: null },
    npm: commandVersion("npm"),
    rustc: commandVersion("rustc"),
    cargo: commandVersion("cargo"),
  },
  dependencyLocks: await Promise.all([lockEvidence("package-lock.json"), lockEvidence("src-tauri/Cargo.lock")]),
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
console.log(`Wrote release build evidence to ${outputArg}.`);
