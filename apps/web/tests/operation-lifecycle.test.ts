import assert from "node:assert/strict";
import test from "node:test";
import { approveOperationCosts, calculateImport, effectiveOperationStatus, hasApprovedBudget, operationStatusOptions, type ImportOperation, type ImportBudget } from "@exporta/domain";

const budget: ImportBudget = { id: "budget-1", name: "Costs", number: 1, status: "draft", createdAt: "2026-10-01", exchangeRate: 5, marginRate: 0, taxRates: [], expenses: [{ id: "freight", category: "freight", label: "Freight", amount: 200, currency: "BRL", allocationMethod: "fob", status: "estimated" }] };
const operation: ImportOperation = { id: "imp-1", reference: "EB-2026-001", customer: "Client", port: "", container: "", status: "draft", portStatus: "awaiting_departure", customsChannel: "unassigned", eta: "2026-10-10", createdAt: "2026-10-01", updatedAt: "2026-10-01", exchangeRate: 5, freightBrl: 200, insuranceBrl: 0, portExpensesBrl: 0, items: [{ id: "item-1", name: "Product", ncm: "", quantity: 2, unitPriceUsd: 10, grossWeightKg: 1, iiRate: 0, ipiRate: 0 }] };

test("cost and approved phases expose distinct status options without altering legacy records", () => {
  assert.deepEqual(operationStatusOptions(operation), ["draft", "quotation", "awaiting_approval"]);
  const legacy = { ...operation, status: "in_transit" as const };
  assert.equal(effectiveOperationStatus(legacy), "quotation");
  assert.equal(legacy.status, "in_transit");
  const approved = { ...operation, budgets: [{ ...budget, status: "approved" as const }] };
  assert.equal(effectiveOperationStatus(approved), "awaiting_shipment");
  assert.deepEqual(operationStatusOptions(approved), ["awaiting_shipment", "in_transit", "at_port", "customs", "cleared", "completed"]);
});

test("approval retains cost inputs, records who and when, and starts shipment tracking", () => {
  const changes = approveOperationCosts(operation, budget, "Lucas", "2026-10-01T03:00:00Z");
  const approved = { ...operation, ...changes };
  assert.equal(hasApprovedBudget(approved), true);
  assert.equal(approved.status, "awaiting_shipment");
  assert.equal(approved.shipmentStatus, "not_shipped");
  assert.equal(approved.budgets?.[0].approvedBy, "Lucas");
  assert.equal(approved.budgets?.[0].approvedAt, "2026-10-01T03:00:00Z");
  assert.equal(calculateImport(approved).totalCost, calculateImport(operation).totalCost);
  assert.equal(operation.budgets, undefined);
  const existing = { ...operation, budgets: [budget], status: "awaiting_approval" as const };
  assert.equal(approveOperationCosts(existing, { ...budget, id: "unused" }, "Lucas").budgets?.length, 1);
  assert.equal(budget.status, "draft");
  const defaults = { ...budget, taxRates: [{ code: "pis_import" as const, rate: 10, source: "default" as const }], marginRate: 20 };
  assert.equal(calculateImport({ ...operation, ...approveOperationCosts(operation, defaults, "Lucas") }).totalCost, calculateImport(operation).totalCost);
});
