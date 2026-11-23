import test from "node:test";
import assert from "node:assert/strict";

for (const m of ["engine/index", "engine/canonical", "rival/index", "missions/index", "storage/index", "ui/index"]) {
  test(`module ${m} imports`, async () => {
    const mod = await import(`../dist/${m}.js`);
    assert.ok(Array.isArray(mod.parentTicket));
  });
}

test("stub fails with the not-implemented message", async () => {
  const { notImplemented } = await import("../dist/not-implemented.js");
  assert.throws(() => notImplemented(2), { message: "not implemented yet: see #2" });
});
