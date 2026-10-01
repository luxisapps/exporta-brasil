import assert from "node:assert/strict";
import test from "node:test";
import { taxRateLabels } from "@exporta/domain";
import { canWriteSetting, manualTaxRates } from "../src/tax-settings.js";

test("operators can change tax defaults without access to other settings", () => {
  assert.equal(canWriteSetting("operator", "tax-rates"), true);
  assert.equal(canWriteSetting("operator", "other"), false);
  assert.equal(canWriteSetting("admin", "other"), true);
});

test("manual defaults accept zero, reject malformed sets and stamp their real source", () => {
  const values = Object.keys(taxRateLabels).map(code => ({ code, rate: 0, source: "siscomex" }));
  const result = manualTaxRates(values, "2026-10-01T12:00:00Z");
  assert.equal(result?.length, values.length);
  assert.equal(result?.[0].source, "manual");
  assert.equal(result?.[0].updatedAt, "2026-10-01T12:00:00Z");
  assert.equal(manualTaxRates(values.slice(1)), null);
  for (const rate of [-1, NaN, Infinity, "12"]) assert.equal(manualTaxRates([{ ...values[0], rate }, ...values.slice(1)]), null);
  assert.equal(manualTaxRates([values[1], ...values.slice(1)]), null);
});
