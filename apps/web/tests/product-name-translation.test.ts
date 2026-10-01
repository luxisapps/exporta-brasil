import test from "node:test";
import assert from "node:assert/strict";
import { translateImportedProducts } from "../src/lib/product-name-translation.ts";
import { SessionExpiredError } from "../src/lib/api-fetch.ts";
import type { ImportedProduct } from "../src/lib/product-sheet.ts";

const product = (name: string): ImportedProduct => ({ name, ncm: "", quantity: 2, unitPriceUsd: 12, grossWeightKg: 1, iiRate: 0, ipiRate: 0 });

test("network and provider failures preserve Chinese names and clear Portuguese names", async () => {
  const originalFetch = globalThis.fetch;
  try {
    for (const fetcher of [async () => { throw new Error("offline"); }, async () => new Response("unavailable", { status: 503 })]) {
      globalThis.fetch = fetcher;
      const result = await translateImportedProducts([product("背包"), product("Mochila")], "https://test.example", "test-token");
      assert.equal(result[0].name, "");
      assert.equal(result[0].chineseName, "背包");
      assert.equal(result[0].unitPriceUsd, 12);
      assert.equal(result[1].name, "Mochila");
    }
    globalThis.fetch = async () => new Response(JSON.stringify({ message: "Sessão inválida." }), { status: 401 });
    await assert.rejects(translateImportedProducts([product("背包")], "https://test.example", "test-token"), SessionExpiredError);
  } finally { globalThis.fetch = originalFetch; }
});

test("keeps cache hits when another name cannot be translated", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ translations: [
    { original: "背包", translated: "Mochila", source: "cache" },
    { original: "发饰", translated: null, source: "untranslated" }
  ] }));
  try {
    const result = await translateImportedProducts([product("背包"), product("发饰")], "https://test.example", "test-token");
    assert.equal(result[0].name, "Mochila");
    assert.equal(result[1].name, "");
    assert.equal(result[1].chineseName, "发饰");
  } finally { globalThis.fetch = originalFetch; }
});

test("translates unique Chinese names and preserves all original product data", async () => {
  const originalFetch = globalThis.fetch;
  const requests: string[][] = [];
  globalThis.fetch = async (_url, options) => {
    const names = JSON.parse(String(options?.body)).names as string[];
    requests.push(names);
    return new Response(JSON.stringify({ translations: names.map((original) => ({ original, translated: "Mochila" })) }));
  };
  try {
    const original = [product("背包"), { ...product("背包"), quantity: 5 }, { ...product("Nome já revisado"), chineseName: "背包" }];
    const translated = await translateImportedProducts(original, "https://test.example", "test-token");
    assert.deepEqual(requests, [["背包"]]);
    assert.equal(translated[0].name, "Mochila");
    assert.equal(translated[0].chineseName, "背包");
    assert.equal(translated[1].quantity, 5);
    assert.equal(translated[2].name, "Nome já revisado");
    assert.equal(original[0].name, "背包");
  } finally { globalThis.fetch = originalFetch; }
});

test("does not call translation for Portuguese names and leaves mismatched rows blank", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error("unexpected provider call"); };
  try {
    const products = [product("Mochila")];
    assert.deepEqual(await translateImportedProducts(products, "https://test.example", "test-token"), products);
    globalThis.fetch = async () => new Response(JSON.stringify({ translations: [{ original: "wrong row", translated: "Mochila" }] }));
    const pending = await translateImportedProducts([product("背包")], "https://test.example", "test-token");
    assert.equal(pending[0].name, "");
    assert.equal(pending[0].chineseName, "背包");
  } finally { globalThis.fetch = originalFetch; }
});

test("splits large sheets into bounded batches with progress", async () => {
  const originalFetch = globalThis.fetch;
  const sizes: number[] = [];
  globalThis.fetch = async (_url, options) => {
    const names = JSON.parse(String(options?.body)).names as string[];
    sizes.push(names.length);
    return new Response(JSON.stringify({ translations: names.map((original) => ({ original, translated: `Produto ${original.replace(/\D/g, "")}` })) }));
  };
  try {
    const progress: number[] = [];
    const result = await translateImportedProducts(Array.from({ length: 135 }, (_, index) => product(`背包 ${index}`)), "https://test.example", "test-token", (done) => progress.push(done));
    assert.deepEqual(sizes, [50, 50, 35]);
    assert.deepEqual(progress, [0, 50, 100, 135]);
    assert.equal(result[134].name, "Produto 134");
  } finally { globalThis.fetch = originalFetch; }
});
