import { strict as assert } from "node:assert";
import { test } from "node:test";
import { joinPhone, splitPhone } from "../src/lib/phone";

test("existing international phones keep their code and local formatting", () => {
  assert.deepEqual(splitPhone("+55 11 99999-9999", "CN"), { country: "BR", number: "11 99999-9999" });
  assert.deepEqual(splitPhone("+8613800138000", "BR"), { country: "CN", number: "13800138000" });
});
test("legacy local phones use the customer's country; optional phones stay empty", () => {
  assert.deepEqual(splitPhone("138 0013 8000", "CN"), { country: "CN", number: "138 0013 8000" });
  assert.equal(joinPhone("BR", " "), "");
  assert.equal(joinPhone("BR", "11 99999-9999"), "+55 11 99999-9999");
});
test("shared calling codes prefer the selected country", () => {
  assert.deepEqual(splitPhone("+1 416 555 0123", "CA"), { country: "CA", number: "416 555 0123" });
});
