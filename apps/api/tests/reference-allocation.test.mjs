import test from "node:test";
import assert from "node:assert/strict";
import { allocateImportReference } from "../dist/import-reference.js";

test("uses the sequence returned by PostgreSQL rather than a client-generated reference", async () => {
  const database = { query: async (_sql, values) => { assert.deepEqual(values, [2026, 3]); return { rows: [{ sequence: "19" }] }; } };
  const reference = await allocateImportReference(database, [{ reference: "EB-2026-002" }, { reference: "EB-2025-099" }], 2026);
  assert.equal(reference, "EB-2026-019");
});

test("starts a new year's sequence at 001 and preserves sequences above 999", async () => {
  const database = { query: async (_sql, values) => { assert.deepEqual(values, [2027, 1]); return { rows: [{ sequence: "1" }] }; } };
  assert.equal(await allocateImportReference(database, [{ reference: "EB-2026-999" }], 2027), "EB-2027-001");
  assert.equal(await allocateImportReference({ query: async () => ({ rows: [{ sequence: "1001" }] }) }, [], 2026), "EB-2026-1001");
});
