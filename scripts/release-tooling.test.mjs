import assert from "node:assert/strict";
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import process from "node:process";
import test from "node:test";

const currentScripts = new URL("./", import.meta.url);

async function createFixture({ includeLocks = false, lockPackageVersion = "2.0.13" } = {}) {
  const root = await mkdtemp(join(tmpdir(), "textlens-release-tooling-"));
  const scripts = join(root, "scripts");
  await mkdir(scripts, { recursive: true });

  await Promise.all([
    copyFile(new URL("check-release-readiness.mjs", currentScripts), join(scripts, "check-release-readiness.mjs")),
    copyFile(new URL("write-build-evidence.mjs", currentScripts), join(scripts, "write-build-evidence.mjs")),
  ]);

  await writeFile(
    join(root, "package.json"),
    `${JSON.stringify({ name: "textlens", private: true, version: "2.0.13" }, null, 2)}\n`,
    "utf8",
  );

  if (includeLocks) {
    await mkdir(join(root, "src-tauri"), { recursive: true });
    await writeFile(
      join(root, "package-lock.json"),
      `${JSON.stringify(
        {
          name: "textlens",
          version: lockPackageVersion,
          lockfileVersion: 3,
          requires: true,
          packages: {
            "": { name: "textlens", version: lockPackageVersion },
          },
        },
        null,
        2,
      )}\n`,
      "utf8",
    );
    await writeFile(
      join(root, "src-tauri", "Cargo.lock"),
      `# Synthetic test fixture only.\nversion = 4\n\n[[package]]\nname = "textlens"\nversion = "2.0.13"\n`,
      "utf8",
    );
  }

  return root;
}

function runNode(root, script, args = [], env = {}) {
  return spawnSync(process.execPath, [script, ...args], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, ...env },
  });
}

async function withFixture(options, callback) {
  const root = await createFixture(options);
  try {
    await callback(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test("release readiness rejects missing dependency locks", async () => {
  await withFixture({}, async (root) => {
    const result = runNode(root, "scripts/check-release-readiness.mjs");
    assert.equal(result.status, 1);
    assert.match(result.stderr, /package-lock\.json is required/);
    assert.match(result.stderr, /src-tauri\/Cargo\.lock is required/);
  });
});

test("release readiness accepts valid synthetic locks and prints SHA-256 fingerprints", async () => {
  await withFixture({ includeLocks: true }, async (root) => {
    const result = runNode(root, "scripts/check-release-readiness.mjs");
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Release dependency locks are present and readable for TextLens 2\.0\.13\./);

    const hashes = result.stdout.match(/\b[a-f0-9]{64}\b/g) ?? [];
    assert.equal(hashes.length, 2);
  });
});

test("release readiness rejects npm root-version drift", async () => {
  await withFixture({ includeLocks: true, lockPackageVersion: "2.0.12" }, async (root) => {
    const result = runNode(root, "scripts/check-release-readiness.mjs");
    assert.equal(result.status, 1);
    assert.match(result.stderr, /root version 2\.0\.12 does not match package\.json 2\.0\.13/);
  });
});

test("build evidence records allowlisted metadata and lock fingerprints", async () => {
  await withFixture({ includeLocks: true }, async (root) => {
    const output = "release-evidence/test.json";
    const result = runNode(root, "scripts/write-build-evidence.mjs", [output], {
      TEXTLENS_BUILD_STATUS: "success",
      GITHUB_SHA: "synthetic-sha",
      RUNNER_OS: "SyntheticOS",
      RUNNER_ARCH: "SyntheticArch",
    });

    assert.equal(result.status, 0, result.stderr);
    const evidence = JSON.parse(await readFile(join(root, output), "utf8"));

    assert.equal(evidence.schemaVersion, 1);
    assert.equal(evidence.applicationVersion, "2.0.13");
    assert.equal(evidence.buildStatus, "success");
    assert.equal(evidence.git.sha, "synthetic-sha");
    assert.equal(evidence.runner.os, "SyntheticOS");
    assert.equal(evidence.runner.arch, "SyntheticArch");
    assert.equal(evidence.toolchain.node.available, true);
    assert.equal(evidence.dependencyLocks.length, 2);

    for (const lock of evidence.dependencyLocks) {
      assert.equal(lock.present, true);
      assert.equal(typeof lock.bytes, "number");
      assert.match(lock.sha256, /^[a-f0-9]{64}$/);
    }
  });
});
