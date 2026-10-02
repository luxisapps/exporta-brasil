import test from "node:test";
import assert from "node:assert/strict";
import { formSchemas } from "../src/lib/form-schemas";

test("international customer needs only country and legal name", () => {
  assert.equal(formSchemas.customer.safeParse({ country: "CN", legalName: "上海贸易", taxId: "", email: "", postalCode: "SW1A 1AA", phone: "+86 13800138000" }).success, true);
  assert.equal(formSchemas.customer.safeParse({ country: "BR", legalName: "Empresa", taxId: "", email: "" }).success, true);
});
test("CNPJ validates only when provided for Brazil; foreign tax IDs remain free", () => {
  for (const taxId of ["11.222.333/0001-81", "12.ABC.345/01DE-35"]) assert.equal(formSchemas.customer.safeParse({ country: "BR", legalName: "Empresa", taxId, email: "" }).success, true);
  assert.equal(formSchemas.customer.safeParse({ country: "BR", legalName: "Empresa", taxId: "00000000000000", email: "" }).success, false);
  assert.equal(formSchemas.customer.safeParse({ country: "BR", legalName: "Empresa", taxId: "112223330001810", email: "" }).success, false);
  assert.equal(formSchemas.customer.safeParse({ country: "CN", legalName: "Empresa", taxId: "CN-123", email: "" }).success, true);
});
test("optional email accepts empty, validates supplied value, and required name rejects whitespace", () => {
  assert.equal(formSchemas.customer.safeParse({ country: "CN", legalName: "Empresa", taxId: "", email: "inválido" }).success, false);
  assert.equal(formSchemas.profile.safeParse({ name: "  " }).success, false);
});
test("login does not impose the new-password length rule", () => {
  assert.equal(formSchemas.login.safeParse({ email: "test@example.com", password: "old" }).success, true);
  assert.equal(formSchemas.userCreate.safeParse({ name: "Teste", email: "test@example.com", role: "operator", initialPassword: "short" }).success, false);
  const mismatch = formSchemas.initialPassword.safeParse({ password: "password123", confirmation: "different123" });
  assert.equal(mismatch.success, false);
  if (!mismatch.success) assert.deepEqual(mismatch.error.issues[0].path, ["confirmation"]);
});
test("optional dates accept empty and past dates; real dates and times are checked", () => {
  assert.equal(formSchemas.task.safeParse({ title: "Conferir", dueDate: "" }).success, true);
  assert.equal(formSchemas.document.safeParse({ title: "Invoice", type: "Outro", status: "expired", issuedAt: "2025-01-01", expiresAt: "2025-01-02" }).success, true);
  assert.equal(formSchemas.task.safeParse({ title: "Conferir", dueDate: "2026-02-30" }).success, false);
  assert.equal(formSchemas.timeline.safeParse({ title: "Recebido", type: "note", occurredAt: "2026-10-02T25:10" }).success, false);
});
test("new import requires the current API's customer and ETA, allows an unknown port", () => {
  assert.equal(formSchemas.import.safeParse({ customerId: "c1", eta: "2026-10-02", port: "" }).success, true);
  assert.equal(formSchemas.import.safeParse({ customerId: "", eta: "", port: "" }).success, false);
});
const draftItem = { name: "Mochila", quantity: "1", ncm: "", unitPriceUsd: "", grossWeightKg: "", netWeightKg: "", boxCount: "", boxWeightKg: "", unitsPerBox: "", totalVolumeM3: "" };
test("incomplete product can be saved; supplied NCM and numeric values are validated", () => {
  assert.equal(formSchemas.item.safeParse(draftItem).success, true);
  for (const invalid of [{ quantity: "0" }, { quantity: "1.5" }, { unitPriceUsd: "-1" }, { boxCount: "1.2" }, { ncm: "123" }, { tax_ii: "-1" }]) assert.equal(formSchemas.item.safeParse({ ...draftItem, ...invalid }).success, false);
  assert.equal(formSchemas.item.safeParse({ ...draftItem, ncm: "42029200", tax_ii: "0", unitPriceUsd: "0.123456789" }).success, true);
});
test("tax settings require numeric nonnegative values without an arbitrary rate cap", () => {
  assert.equal(formSchemas.taxSettings.safeParse({ ii: "120", ipi: "0" }).success, true);
  for (const value of ["", "-1", "NaN"]) assert.equal(formSchemas.taxSettings.safeParse({ ii: value }).success, false);
});
