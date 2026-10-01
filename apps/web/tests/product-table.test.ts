import test from "node:test";
import assert from "node:assert/strict";
import { selectProducts, type ProductSort } from "../src/lib/product-table.ts";

const products = [
  { id: "a", name: "Acessório 10", chineseName: "发饰", englishName: "Hair clip", sku: "HAIR-10", ncm: "96151900", quantity: 2, unitPriceUsd: 10, grossWeightKg: 1, iiRate: 0, ipiRate: 0, itemFob: 100, ii: 5, ipi: 3, unitCost: 54 },
  { id: "b", name: "Acessório 2", chineseName: "背包", englishName: "Backpack", sku: "BAG-2", ncm: "42029200", quantity: 20, unitPriceUsd: 10, grossWeightKg: 1, iiRate: 0, ipiRate: 0, itemFob: 500, ii: 10, ipi: 20, unitCost: 26.5 },
  { id: "c", name: "", chineseName: "花", englishName: "Flower", sku: "FLOWER", ncm: "67029000", quantity: 5, unitPriceUsd: 10, grossWeightKg: 1, iiRate: 0, ipiRate: 0, itemFob: 50, ii: 1, ipi: 1, unitCost: 10.4 }
];

test("searches accented, Chinese, English, SKU and formatted NCM names across all rows", () => {
  assert.equal(selectProducts(products, "acessorio", "original").length, 2);
  assert.equal(selectProducts(products, "背包", "original")[0].id, "b");
  assert.equal(selectProducts(products, "HAIR clip", "original")[0].id, "a");
  assert.equal(selectProducts(products, "bag-2", "original")[0].id, "b");
  assert.equal(selectProducts(products, "9615.19.00", "original")[0].id, "a");
  assert.deepEqual(selectProducts(products, "not found", "original"), []);
});

test("sorts financial values numerically and product names naturally without changing source order", () => {
  const expected: [ProductSort, string[]][] = [
    ["quantity_asc", ["a", "c", "b"]], ["quantity_desc", ["b", "c", "a"]],
    ["fob_asc", ["c", "a", "b"]], ["fob_desc", ["b", "a", "c"]],
    ["taxes_asc", ["c", "a", "b"]], ["taxes_desc", ["b", "a", "c"]],
    ["unit_cost_asc", ["c", "b", "a"]], ["unit_cost_desc", ["a", "b", "c"]]
  ];
  for (const [sort, ids] of expected) assert.deepEqual(selectProducts(products, "", sort).map((item) => item.id), ids);
  assert.deepEqual(selectProducts(products, "acessorio", "name_asc").map((item) => item.id), ["b", "a"]);
  assert.deepEqual(selectProducts(products, "acessorio", "name_desc").map((item) => item.id), ["a", "b"]);
  assert.deepEqual(products.map((item) => item.id), ["a", "b", "c"]);
  assert.deepEqual(selectProducts(products, "", "original"), products);
});
