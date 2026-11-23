import test from "node:test";
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:net";
import { fileURLToPath } from "node:url";

const serve = fileURLToPath(new URL("../scripts/serve.mjs", import.meta.url));

test("help and version work", () => {
  const help = spawnSync(process.execPath, [serve, "--help"], { encoding: "utf8" });
  assert.equal(help.status, 0);
  assert.match(help.stdout, /Usage/);
  const version = spawnSync(process.execPath, [serve, "--version"], { encoding: "utf8" });
  assert.equal(version.status, 0);
  assert.match(version.stdout, /^\d+\.\d+\.\d+/);
});

test("serves index and tokens, refuses paths outside dist", async () => {
  const probe = createServer();
  await new Promise((r) => probe.listen(0, "127.0.0.1", r));
  const port = probe.address().port;
  await new Promise((r) => probe.close(r));
  const child = spawn(process.execPath, [serve, "--port", String(port)], { stdio: ["ignore", "pipe", "inherit"] });
  try {
    await new Promise((r) => child.stdout.once("data", r));
    const base = `http://127.0.0.1:${port}`;
    const index = await fetch(`${base}/`);
    assert.equal(index.status, 200);
    assert.match(await index.text(), /<title>Tidepost<\/title>/);
    assert.equal((await fetch(`${base}/tokens.css`)).status, 200);
    assert.equal((await fetch(`${base}/..%2Fpackage.json`)).status, 403);
    assert.equal((await fetch(base, { method: "POST" })).status, 405);
  } finally {
    child.kill();
  }
});
