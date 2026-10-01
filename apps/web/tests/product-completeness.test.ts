import test from "node:test";
import assert from "node:assert/strict";
import type { ImportExpense, ImportItem } from "@exporta/domain";
import { missingProductFields, matchesProductDataFilter } from "../src/lib/product-completeness";

const item: ImportItem = { id: "1", name: "Acessorio", ncm: "9615.19.00", quantity: 10, unitPriceUsd: 2, grossWeightKg: 0, iiRate: 0, ipiRate: 0 };
const expense = (allocationMethod: ImportExpense["allocationMethod"], amount = 100): ImportExpense => ({ id: "e", label: "Freight", category: "Freight", amount, allocationMethod, currency: "BRL", status: "estimated" });

test("essential fields identify incomplete imports while zero tax rates and optional fields remain valid", () => {
  assert.deepEqual(missingProductFields(item), []);
  assert.deepEqual(missingProductFields({ ...item, name: "", ncm: "", quantity: 0, unitPriceUsd: 0 }), ["name", "ncm", "quantity", "price"]);
  assert.deepEqual(missingProductFields({ ...item, name: "发饰", ncm: "9615190000" }), ["name", "ncm"]);
  assert.deepEqual(missingProductFields({ ...item, quantity: NaN, iiRate: -1, ipiRate: NaN }), ["quantity", "ii", "ipi"]);
  assert.equal(matchesProductDataFilter(item, "complete"), true);
  assert.equal(matchesProductDataFilter({ ...item, name: "" }, "incomplete"), true);
  assert.equal(matchesProductDataFilter({ ...item, name: "" }, "complete"), false);
});

test("weight and volume are required only for active expenses allocated using those fields", () => {
  assert.deepEqual(missingProductFields(item, [expense("fob")]), []);
  assert.deepEqual(missingProductFields(item, [expense("weight"), expense("volume")]), ["weight", "volume"]);
  assert.deepEqual(missingProductFields(item, [expense("weight", 0)]), []);
  assert.deepEqual(missingProductFields({ ...item, boxWeightKg: 5, boxCount: 2, lengthCm: 10, widthCm: 10, heightCm: 10 }, [expense("weight"), expense("volume")]), []);
  assert.deepEqual(missingProductFields({ ...item, grossWeightKg: 0.1, totalVolumeM3: 0.01 }, [expense("weight"), expense("volume")]), []);
});

test("filter reflects completion edits and does not mutate products", () => {
  const products = [item, { ...item, id: "2", name: "" }];
  assert.deepEqual(products.filter((product) => matchesProductDataFilter(product, "incomplete")).map((product) => product.id), ["2"]);
  const edited = { ...products[1], name: "Produto" };
  assert.equal(matchesProductDataFilter(edited, "incomplete"), false);
  assert.equal(products[1].name, "");
  assert.equal(matchesProductDataFilter(products[1], "all"), true);
});
