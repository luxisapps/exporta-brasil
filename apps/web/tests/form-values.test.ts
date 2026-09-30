import test from "node:test";
import assert from "node:assert/strict";
import { localDateValue, localDateTimeValue, parseLocalDate, numberSeparators } from "../src/lib/form-values.ts";

test("date selection round-trips locally without UTC day shifts", () => {
  const date = new Date(2026, 8, 30, 23, 45);
  assert.equal(localDateValue(date), "2026-09-30");
  assert.equal(localDateTimeValue(date), "2026-09-30T23:45");
  assert.equal(localDateValue(parseLocalDate("2026-09-30")!), "2026-09-30");
  assert.equal(parseLocalDate("2026-02-30"), undefined);
  assert.equal(parseLocalDate(""), undefined);
  assert.equal(parseLocalDate("2028-02-29")?.getDate(), 29);
});
test("number separators follow each supported language", () => {
  assert.deepEqual(numberSeparators("pt-BR"), { decimal: ",", group: "." });
  assert.deepEqual(numberSeparators("en-US"), { decimal: ".", group: "," });
  assert.deepEqual(numberSeparators("zh-CN"), { decimal: ".", group: "," });
});
