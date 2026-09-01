import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import { createHash } from "node:crypto";
import process from "node:process";

const root = new URL("../", import.meta.url);
const requiredLocks = ["package-lock.json", "src-tauri/Cargo.lock"];

async function exists(path) {
  try {
    await access(new URL(path, root), constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

async function readText(path) {
  return readFile(new URL(path, root), "utf8");
}

function sha256(source) {
  return createHash("sha256").update(source).digest("hex");
}

const errors = [];
const packageSource = await readText("package.json");
const packageJson = JSON.parse(packageSource);
const version = packageJson.version;

if (typeof version !== "string" || !/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(version)) {
  errors.push("package.json contains an invalid application version.");
}

for (const path of requiredLocks) {
  if (!(await exists(path))) {
    errors.push(`${path} is required for a reproducible tagged release.`);
  }
}

if (await exists("package-lock.json")) {
  try {
    const lockSource = await readText("package-lock.json");
    const lock = JSON.parse(lockSource);
    if (![2, 3].includes(lock.lockfileVersion)) {
      errors.push(`package-lock.json uses unsupported lockfileVersion ${String(lock.lockfileVersion)}; expected 2 or 3.`);
    }
    const rootPackage = lock.packages?.[""];
    if (rootPackage?.version && rootPackage.version !== version) {
      errors.push(`package-lock.json root version ${rootPackage.version} does not match package.json ${version}.`);
    }
    if (/<<<<<<<|=======|>>>>>>>/.test(lockSource)) {
      errors.push("package-lock.json contains merge-conflict markers.");
    }
  } catch (error) {
    errors.push(`package-lock.json is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
}

if (await exists("src-tauri/Cargo.lock")) {
  try {
    const cargoLock = await readText("src-tauri/Cargo.lock");
    if (!/^version\s*=\s*\d+/m.test(cargoLock)) {
      errors.push("src-tauri/Cargo.lock does not declare a Cargo lockfile format version.");
    }
    if (/<<<<<<<|=======|>>>>>>>/.test(cargoLock)) {
      errors.push("src-tauri/Cargo.lock contains merge-conflict markers.");
    }
  } catch (error) {
    errors.push(`src-tauri/Cargo.lock is unreadable: ${error instanceof Error ? error.message : String(error)}`);
  }
}

if (errors.length) {
  console.error(`Release readiness failed for TextLens ${String(version)}:`);
  for (const error of errors) console.error(`- ${error}`);
  console.error("Generate lockfiles with npm/Cargo in a registry-capable environment, review them, commit them, then retry.");
  process.exit(1);
}

const fingerprints = [];
for (const path of requiredLocks) {
  const source = await readText(path);
  fingerprints.push(`${path}: ${sha256(source)}`);
}

console.log(`Release dependency locks are present and readable for TextLens ${version}.`);
for (const fingerprint of fingerprints) console.log(`- ${fingerprint}`);
