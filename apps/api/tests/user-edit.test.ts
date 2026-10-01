import assert from "node:assert/strict";
import test from "node:test";
import { parseUserEdit, removesLastAdmin } from "../src/user-edit.js";

test("user edits normalize data and cannot change credentials or inject permissions", () => {
  assert.deepEqual(parseUserEdit({ name: " Lucas ", email: " Lucas@Example.com ", role: "operator", phone: " 123 ", jobTitle: " Analista ", passwordHash: "ignored", mustChangePassword: true }), { name: "Lucas", email: "lucas@example.com", role: "operator", phone: "123", jobTitle: "Analista" });
  for (const body of [null, {}, { name: "", email: "a@b.com", role: "admin" }, { name: "Lucas", email: "invalid", role: "admin" }, { name: "Lucas", email: "a@b.com", role: "superadmin" }]) assert.equal(parseUserEdit(body), null);
});

test("the final administrator cannot be demoted", () => {
  assert.equal(removesLastAdmin("admin", "operator", 1), true);
  assert.equal(removesLastAdmin("admin", "operator", 2), false);
  assert.equal(removesLastAdmin("admin", "admin", 1), false);
  assert.equal(removesLastAdmin("operator", "admin", 1), false);
});
