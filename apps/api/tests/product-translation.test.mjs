import test from "node:test";
import assert from "node:assert/strict";
import { googleTranslateNames, translateProductNames, translationKey } from "../dist/product-translation.js";

function databaseFixture() {
  const rows = new Map();
  let lock = Promise.resolve();
  const select = async (_sql, [keys]) => ({ rows: keys.flatMap((key) => rows.has(key) ? [rows.get(key)] : []) });
  return {
    rows, query: select,
    async connect() {
      let unlock;
      const writes = new Map();
      return {
        async query(sql, values) {
          if (sql.includes("pg_advisory")) {
            const previous = lock;
            lock = new Promise((resolve) => { unlock = resolve; });
            await previous;
          } else if (sql.startsWith("SELECT source_text")) return select(sql, values);
          else if (sql.startsWith("INSERT")) writes.set(values[0], { source_text: values[1], translated_text: values[2] });
          else if (sql === "COMMIT") { writes.forEach((row, key) => rows.set(key, row)); unlock?.(); }
          else if (sql === "ROLLBACK") { writes.clear(); unlock?.(); }
          return { rows: [] };
        },
        release() {}
      };
    }
  };
}

test("deduplicates a batch and reuses persistent cache on subsequent calls", async () => {
  const database = databaseFixture();
  const chinese = "发饰5件套";
  let calls = 0;
  const translate = async (names) => { calls++; assert.deepEqual(names, [chinese]); return ["Kit com 5 acessórios para cabelo"]; };
  const first = await translateProductNames(database, [chinese, chinese], translate);
  assert.equal(first.length, 2);
  assert.equal(first[0].source, "google");
  const second = await translateProductNames(database, [chinese], async () => { throw new Error("must not call provider"); });
  assert.equal(second[0].source, "cache");
  assert.equal(second[0].translated, first[0].translated);
  assert.equal(calls, 1);
});

test("concurrent cache misses make one provider call", async () => {
  const database = databaseFixture();
  let calls = 0;
  const translate = async () => { calls++; return ["Mochila"]; };
  const results = await Promise.all([translateProductNames(database, ["背包"], translate), translateProductNames(database, ["背包"], translate)]);
  assert.equal(calls, 1);
  assert.deepEqual(results.map((items) => items[0].source).sort(), ["cache", "google"]);
});

test("returns saved translations even when Google fails for new names", async () => {
  const database = databaseFixture();
  await translateProductNames(database, ["背包"], async () => ["Mochila"]);
  const result = await translateProductNames(database, ["背包", "发饰"], async () => { throw new Error("missing key"); });
  assert.deepEqual(result, [
    { original: "背包", translated: "Mochila", source: "cache" },
    { original: "发饰", translated: null, source: "untranslated" }
  ]);
  assert.equal(database.rows.size, 1);
});

test("failed or incomplete provider responses never poison the cache", async () => {
  const database = databaseFixture();
  assert.equal((await translateProductNames(database, ["背包"], async () => []))[0].source, "untranslated");
  assert.equal(database.rows.size, 0);
  assert.equal((await translateProductNames(database, ["背包"], async () => { throw new Error("quota"); }))[0].translated, null);
  assert.equal(database.rows.size, 0);
  assert.notEqual(translationKey("背包"), translationKey("背包 M"));
});

test("Google request uses NMT, text format, Portuguese and backend-only key", async () => {
  const result = await googleTranslateNames(["背包"], "test-key", async (url, options) => {
    assert.equal(url, "https://translation.googleapis.com/language/translate/v2");
    assert.equal(options.headers["x-goog-api-key"], "test-key");
    assert.deepEqual(JSON.parse(options.body), { q: ["背包"], source: "zh", target: "pt", format: "text", model: "nmt" });
    return new Response(JSON.stringify({ data: { translations: [{ translatedText: "Mochila" }] } }));
  });
  assert.deepEqual(result, ["Mochila"]);
  await assert.rejects(googleTranslateNames(["背包"], "test-key", async () => new Response(JSON.stringify({ data: { translations: [] } }))));
});
