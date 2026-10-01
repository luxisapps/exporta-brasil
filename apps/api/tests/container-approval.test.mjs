import test from "node:test";
import assert from "node:assert/strict";
import { hasApprovedBudget } from "../../../packages/domain/dist/index.js";

test("container editing requires an approved budget, even for an operation already shipped", () => {
  assert.equal(hasApprovedBudget({}), false);
  assert.equal(hasApprovedBudget({ budgets: [] }), false);
  assert.equal(hasApprovedBudget({ budgets: [{ status: "draft" }], shipmentStatus: "shipped" }), false);
  assert.equal(hasApprovedBudget({ budgets: [{ status: "superseded" }] }), false);
});

test("an approved budget unlocks container editing regardless of the order of versions", () => {
  assert.equal(hasApprovedBudget({ budgets: [{ status: "approved" }] }), true);
  assert.equal(hasApprovedBudget({ budgets: [{ status: "draft" }, { status: "approved" }] }), true);
});
