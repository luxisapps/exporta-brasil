import test from "node:test";
import assert from "node:assert/strict";
import { calculateImport, type ImportOperation, type ImportBudget } from "@exporta/domain";

const budget: ImportBudget = { id: "b1", name: "Costs", number: 1, status: "draft", createdAt: "2026-10-01", exchangeRate: 5, marginRate: 0, taxRates: [{ code: "pis_import", rate: 2, source: "manual" }, { code: "cofins_import", rate: 8, source: "manual" }], expenses: [] };
const operation: ImportOperation = { id: "i1", reference: "EB-2026-001", customer: "Client", port: "", container: "", status: "draft", portStatus: "awaiting_departure", customsChannel: "unassigned", eta: "", createdAt: "2026-10-01", updatedAt: "2026-10-01", exchangeRate: 5, freightBrl: 0, insuranceBrl: 0, portExpensesBrl: 0, budgets: [budget], items: [{ id: "p1", name: "Product", ncm: "", quantity: 10, unitPriceUsd: 10, grossWeightKg: 1, iiRate: 10, ipiRate: 10 }] };

test("editing expenses and exchange rate recalculates full summary and product costs", () => {
  const initial = calculateImport(operation);
  assert.equal(initial.fobBrl, 500);
  assert.equal(initial.taxes, 155);
  assert.equal(initial.items[0].taxes, 155);
  const changed = { ...operation, budgets: [{ ...budget, expenses: [{ id: "e1", category: "logistics", label: "Other expense", amount: 1000.5, currency: "BRL" as const, allocationMethod: "fob" as const, status: "estimated" as const }] }] };
  const estimated = calculateImport(changed);
  assert.equal(estimated.baseExpenses, 1000.5);
  assert.equal(estimated.totalCost, 1655.5);
  assert.equal(estimated.items[0].allocatedExpenses, 1000.5);
  assert.equal(estimated.items[0].unitCost, 165.55);
  const exchange = calculateImport({ ...changed, budgets: [{ ...changed.budgets[0], exchangeRate: 6 }] });
  assert.equal(exchange.fobBrl, 600);
  assert.equal(exchange.taxes, 186);
  assert.equal(exchange.totalCost, 1786.5);
});

test("all expenses remain in total before products or allocation weights are available", () => {
  const expenses = [{ id: "e1", category: "logistics", label: "Other expense", amount: 100, currency: "BRL" as const, allocationMethod: "weight" as const, status: "estimated" as const }];
  assert.equal(calculateImport({ ...operation, items: [], budgets: [{ ...budget, expenses }] }).totalCost, 100);
  const noWeight = calculateImport({ ...operation, items: [{ ...operation.items[0], grossWeightKg: 0 }], budgets: [{ ...budget, expenses }] });
  assert.equal(noWeight.items[0].allocatedExpenses, 0);
  assert.equal(noWeight.totalCost, 755);
  assert.equal(noWeight.totalCost, noWeight.fobBrl + noWeight.baseExpenses + noWeight.taxes);
});

test("markup changes the suggested price while preserving import costs", () => {
  const result = calculateImport({ ...operation, budgets: [{ ...budget, marginRate: 20 }] });
  assert.equal(result.totalCost, 655);
  assert.equal(result.suggestedSaleTotal, 786);
  assert.equal(calculateImport({ ...operation, budgets: [{ ...budget, marginRate: -1 }] }).suggestedSaleTotal, null);
});
