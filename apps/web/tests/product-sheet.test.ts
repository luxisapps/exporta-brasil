import test from "node:test";
import assert from "node:assert/strict";
import * as XLSX from "@e965/xlsx";
import { parseProductSheet } from "../src/lib/product-sheet.ts";

const fileFromWorkbook = (workbook: XLSX.WorkBook) => new File([
  new Uint8Array(XLSX.write(workbook, { type: "buffer", bookType: "xlsx", compression: false }))
], "products.xlsx");

test("extracts products from XLSX larger than 5 MB without a size cap", async () => {
  const workbook = XLSX.utils.book_new();
  const rows = [["Produto", "Quantidade", "Valor unitario USD", "Descricao detalhada"]];
  for (let index = 0; index < 250; index++) rows.push([`Product ${index}`, "3", "12.50", "Details ".repeat(3000)]);
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), "Products");
  const file = fileFromWorkbook(workbook);
  assert.ok(file.size > 5 * 1024 * 1024);
  const result = await parseProductSheet(file);
  assert.equal(result.items.length, 250);
  assert.equal(result.items[249].name, "Product 249");
  assert.equal(result.items[249].quantity, 3);
  assert.equal(result.items[249].unitPriceUsd, 12.5);
  assert.equal(result.items[249].description?.length, "Details ".repeat(3000).trim().length);
});

test("preserves sheet selection and invalid-quantity warnings", async () => {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([["Notes"], ["No products"]]), "Notes");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([["Produto", "Quantidade"], ["Small", 1]]), "Small");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([["Produto", "Quantidade"], ["First", 2], ["Invalid", 0], ["Last", 4]]), "Main");
  const result = await parseProductSheet(fileFromWorkbook(workbook));
  assert.equal(result.sheetName, "Main");
  assert.deepEqual(result.items.map((item) => item.name), ["First", "Last"]);
  assert.equal(result.warnings.length, 2);
});
