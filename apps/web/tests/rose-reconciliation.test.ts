import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as XLSX from "@e965/xlsx";
import { applyProductDefaults, calculateImport, type ImportOperation } from "@exporta/domain";
import { readRoseProductSheet } from "../src/lib/rose-product-sheet";
import { readFinalCostSheet } from "../src/lib/final-cost-sheet";
import { manualProductDefaults } from "../../api/src/tax-settings";

const fixture = JSON.parse(readFileSync("apps/web/tests/fixtures/rose-reconciliation.json", "utf8"));
const sheet = (cells: Record<string, { value: unknown; formula: unknown }>, ref: string) => Object.assign(Object.fromEntries(Object.entries(cells).map(([key, cell]) => [key, { v: cell.value, t: typeof cell.value === "number" ? "n" : "s", ...(typeof cell.formula === "string" && cell.formula.startsWith("=") ? { f: cell.formula.slice(1) } : {}) }])), { "!ref": ref }) as XLSX.WorkSheet;
const roseBook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(roseBook, sheet(fixture.rose, "A1:AG146"), "Preparação");
const rose = readRoseProductSheet(roseBook)!;
const operation = (data: typeof rose): ImportOperation => ({ id: "test", reference: "TEST", customer: "QA", port: "", container: "", status: "draft", portStatus: "awaiting_departure", customsChannel: "unassigned", eta: "", createdAt: "", updatedAt: "", exchangeRate: 5.15, freightBrl: 0, insuranceBrl: 0, portExpensesBrl: 0, items: data.items.map((item, index) => ({ ...item, id: String(index) })), budgets: [{ id: "budget", name: "Custo", number: 1, status: "draft", createdAt: "", taxRates: [], ...data.budget, exchangeRate: 5.15 }] });
const close = (actual: number, expected: number, tolerance = .011) => assert.ok(Math.abs(actual - expected) < tolerance, `${actual} != ${expected}`);

test("Rose's net weight, pauta, surplus, FOB, freight and CFR reconcile on every row", () => {
  const calc = calculateImport(operation(rose));
  assert.equal(calc.items.length, 135);
  assert.equal(calc.calculationReady, true);
  close(calc.items.reduce((sum, item) => sum + item.quantity, 0), 38182);
  close(calc.totalWeight, 19329.714);
  close(calc.pricingTotals!.netWeightKg, 17396.7426, .000001);
  calc.items.forEach(item => {
    const row = Number(item.name.replace("Produto ", ""));
    close(item.netWeightKg!, fixture.rose[`AA${row}`].value, .000001);
    close(item.pricing!.inputUsd, fixture.rose[`AE${row}`].value);
    close(item.pricing!.freight / calc.exchangeRate, fixture.rose[`AF${row}`].value);
    close(item.pricing!.inputUsd + item.pricing!.freight / calc.exchangeRate, fixture.rose[`AG${row}`].value, .02);
  });
  close(calc.fobBrl / calc.exchangeRate, 35507.247444);
  close(calc.fobBrl / calc.exchangeRate + 8000, fixture.final["PREÇO POR ITEM"].D54.value);
});

test("the real final workbook reconciles all entry and output taxes and final totals", () => {
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet(fixture.final.FECHAMENTO, "A1:E45"), "FECHAMENTO");
  XLSX.utils.book_append_sheet(book, sheet(fixture.final["PREÇO POR ITEM"], "A1:AH54"), "PREÇO POR ITEM");
  const imported = readFinalCostSheet(book)!;
  const calc = calculateImport(operation(imported));
  const totals = fixture.final["PREÇO POR ITEM"];
  for (const [field, cell] of Object.entries({ cifBrl: "E54", saleTotal: "T54", outputTaxes: "E20" })) {
    const expected = cell === "E20" ? fixture.final.FECHAMENTO[cell].value : totals[cell].value;
    close(calc.pricingTotals![field as "cifBrl" | "saleTotal" | "outputTaxes"]!, expected);
  }
  close(calc.totalCost, totals.Q54.value);
  calc.items.forEach((item, index) => { const row = index + 9; for (const [key, col] of Object.entries({ pisNet:"V", cofinsNet:"X", ipiNet:"Z", icmsSale:"AB", csll:"AD", irpj:"AF", irpjAdditional:"AH" })) close(item.pricing![key as "pisNet"], totals[`${col}${row}`].value); });
});

test("defaults are snapshotted, zero overrides work and existing net weights are preserved", () => {
  const original = { ...rose.items[0], netWeightKg: undefined, netWeightReductionRate: undefined };
  const item = applyProductDefaults(original);
  assert.equal(item.netWeightReductionRate, 6);
  assert.equal(applyProductDefaults(item, 12).netWeightReductionRate, 6);
  assert.equal(applyProductDefaults({ ...original, netWeightKg: 5.4 }, 12).netWeightReductionRate, undefined);
  const op = operation(rose); op.items = [{ ...item, id:"one", netWeightReductionRate:0 }]; op.budgets![0].freightWeightKg = undefined;
  close(calculateImport(op).items[0].netWeightKg!, 6, .000001);
  assert.deepEqual(manualProductDefaults({ netWeightReductionRate:6 }), { netWeightReductionRate:6 });
  assert.equal(manualProductDefaults({ netWeightReductionRate:101 }), null);
});
