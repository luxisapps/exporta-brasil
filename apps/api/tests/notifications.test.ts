import test from "node:test";
import assert from "node:assert/strict";
import type { ImportOperation } from "@exporta/domain";
import { dueNotices, operationNotices } from "../src/notification-rules.js";
const operation = { id: "test", reference: "EB-2026-999", assigneeId: "owner", status: "draft", portStatus: "awaiting_departure", customsChannel: "unassigned", items: [], tasks: [], documents: [], timeline: [] } as unknown as ImportOperation;

test("assignment targets new and previous owner, excluding the actor", () => {
  const notices = operationNotices(operation, { ...operation, assigneeId: "new-owner" }, "owner");
  assert.deepEqual(notices.map(item => item.recipients), [["new-owner"]]);
  assert.equal(operationNotices(null, operation, "owner").length, 0);
});
test("new tasks notify the assigned user and owner exactly once each", () => {
  const next = { ...operation, tasks: [{ id: "task", title: "Enviar invoice", assigneeId: "worker", completed: false, createdAt: "2026-10-01" }] };
  assert.deepEqual(operationNotices(operation, next, "admin")[0].recipients, ["owner", "worker"]);
  assert.deepEqual(operationNotices(operation, next, "owner")[0].recipients, ["worker"]);
  assert.deepEqual(operationNotices(operation, { ...next, assigneeId: "worker" }, "admin").find(item => item.kind === "task_assigned")?.recipients, ["worker"]);
});
test("documents and critical channels target the operation owner with the correct section", () => {
  const next = { ...operation, customsChannel: "red" as const, documents: [{ id: "doc", title: "Invoice", type: "invoice", status: "available" as const, createdAt: "2026-10-01" }] };
  const notices = operationNotices(operation, next, "admin");
  assert.equal(notices.find(item => item.kind === "customsChannel")?.critical, true);
  assert.equal(notices.find(item => item.kind === "document_added")?.section, "documents");
  assert.equal(operationNotices(next, next, "admin").length, 0);
});
test("completion and reassignment include relevant recipients, with no own-action notices", () => {
  const before = { ...operation, tasks: [{ id: "task", title: "Conferir", assigneeId: "worker", completed: false, createdAt: "2026-10-01" }] };
  assert.deepEqual(operationNotices(before, { ...before, tasks: [{ ...before.tasks[0], completed: true }] }, "worker")[0].recipients, ["owner"]);
  const notices = operationNotices(before, { ...before, tasks: [{ ...before.tasks[0], assigneeId: "new" }] }, "admin");
  assert.ok(notices.some(item => item.kind === "task_unassigned" && item.recipients.includes("worker")));
});
test("reminders have stable daily deduplication keys and ignore completed tasks and operations", () => {
  const next = { ...operation, tasks: [{ id: "task", title: "Invoice", assigneeId: "owner", dueDate: "2026-09-30", completed: false, createdAt: "2026-09-29" }] };
  const reminders = dueNotices(next, "2026-10-01");
  assert.deepEqual(reminders[0].recipients, ["owner"]);
  assert.equal(reminders[0].kind, "task_overdue");
  assert.equal(reminders[0].key, dueNotices(next, "2026-10-01")[0].key);
  assert.notEqual(reminders[0].key, dueNotices(next, "2026-10-02")[0].key);
  assert.equal(dueNotices({ ...next, status: "completed" }, "2026-10-01").length, 0);
  assert.equal(dueNotices({ ...next, tasks: [{ ...next.tasks[0], completed: true }] }, "2026-10-01").length, 0);
});
test("document expiry reminders use a three-day window", () => {
  const next = { ...operation, documents: [{ id: "doc", title: "Licença", type: "other", status: "available" as const, expiresAt: "2026-10-04", createdAt: "2026-10-01" }] };
  assert.equal(dueNotices(next, "2026-10-01")[0].kind, "document_expiring");
  assert.equal(dueNotices(next, "2026-09-30").length, 0);
  assert.equal(dueNotices(next, "2026-10-05")[0].kind, "document_expired");
});
