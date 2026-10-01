import assert from "node:assert/strict";
import test from "node:test";
import type { ImportOperation } from "@exporta/domain";
import { selectMyTasks, validTaskDate } from "../src/lib/my-tasks";
const operation = { id: "operation", reference: "EB-2026-001", customer: "Cliente", tasks: [
  { id: "other", title: "Outro usuário", assigneeId: "other-user", completed: false },
  { id: "complete", title: "Concluída", assigneeId: "me", completed: true },
  { id: "later", title: "Prazo futuro", assigneeId: "me", completed: false, dueDate: "2026-10-04" },
  { id: "undated", title: "Sem prazo", assigneeId: "me", completed: false },
  { id: "overdue", title: "Atrasada", assigneeId: "me", completed: false, dueDate: "2026-09-30" },
] } as unknown as ImportOperation;
test("personal tasks exclude other users and completed tasks, prioritizing deadlines", () => {
  const result = selectMyTasks([operation], "me");
  assert.deepEqual(result.map(item => item.task.id), ["overdue", "later", "undated"]);
  assert.equal(result[0].operationId, "operation");
  assert.deepEqual(selectMyTasks([operation], "unassigned-user"), []);
  assert.deepEqual(selectMyTasks([{ ...operation, tasks: undefined }], "me"), []);
});
test("invalid dates are treated as tasks without a deadline", () => {
  assert.equal(validTaskDate("2026-02-30"), undefined);
  assert.equal(validTaskDate("invalid"), undefined);
  assert.equal(validTaskDate("2026-10-01"), "2026-10-01");
});
